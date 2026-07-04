import type Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";
import { getStripe } from "@/lib/stripe";

// El webhook usa el SDK de Stripe (verificación de firma con crypto) y el
// cliente de servicio de Supabase: necesita el runtime de Node, no el Edge.
export const runtime = "nodejs";

// Cliente de Supabase con SERVICE ROLE, definido AQUÍ y solo aquí.
// - Salta RLS: el webhook no tiene sesión de usuario (lo llama Stripe).
// - Al estar declarado dentro del route handler no puede importarse desde
//   ningún otro sitio, así que nunca llegará al cliente/navegador.
// - La clave no lleva prefijo NEXT_PUBLIC_, por lo que tampoco se expone.
function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    throw new Error(
      "Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en el entorno."
    );
  }
  return createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export async function POST(request: Request) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error("[stripe webhook] Falta STRIPE_WEBHOOK_SECRET en el entorno.");
    return new Response("Webhook no configurado.", { status: 500 });
  }

  // CUERPO CRUDO: la firma se calcula sobre los bytes exactos que envió Stripe.
  // Hay que leerlo con request.text() (sin parsear). Si usáramos request.json()
  // Next.js reserializaría el objeto y la firma dejaría de coincidir.
  const rawBody = await request.text();
  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return new Response("Falta la cabecera stripe-signature.", { status: 400 });
  }

  const stripe = getStripe();
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (err) {
    // Firma inválida: no viene de Stripe (o el secreto no coincide). No tocamos nada.
    const msg = err instanceof Error ? err.message : "firma no verificable";
    console.error("[stripe webhook] Firma inválida:", msg);
    return new Response("Firma inválida.", { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    try {
      await procesarPagoCompletado(session);
    } catch (err) {
      // Error inesperado procesando el pago: lo registramos y devolvemos 500
      // para que Stripe reintente el evento más tarde.
      console.error("[stripe webhook] Error procesando el pago:", err);
      return new Response("Error procesando el pago.", { status: 500 });
    }
  }

  // Cualquier otro evento (o el ya procesado): confirmamos recepción.
  return new Response("ok", { status: 200 });
}

async function procesarPagoCompletado(session: Stripe.Checkout.Session) {
  const metadata = session.metadata ?? {};
  const leadId = metadata.lead_id ?? null;
  const tipo = metadata.tipo; // 'reserva50' | 'total' | 'resto'
  const importeACobrar = Number(metadata.importe_a_cobrar);
  const importePendiente = Number(metadata.importe_pendiente);
  const importeTotalMeta = Number(metadata.importe_total);

  const supabase = getSupabaseAdmin();

  // Campos resultantes de la fila de pago según el tipo de cobro.
  // - 'resto': se ha cobrado el importe restante -> pagado el total, 0 pendiente
  //   y estado "Pagado 100%". También se fija tipo='resto' en la fila.
  // - 'total': pago único con descuento -> "Pagado 100%".
  // - 'reserva50': se cobra el 50% y queda el resto pendiente -> "Reserva 50%".
  let importePagadoFinal: number | null;
  let importePendienteFinal: number | null;
  let estado: string | null;
  const camposExtra: Record<string, unknown> = {};

  if (tipo === "resto") {
    importePagadoFinal = Number.isFinite(importeTotalMeta) ? importeTotalMeta : null;
    importePendienteFinal = 0;
    estado = "Pagado 100%";
    camposExtra.tipo = "resto";
  } else {
    importePagadoFinal = Number.isFinite(importeACobrar) ? importeACobrar : null;
    importePendienteFinal = Number.isFinite(importePendiente)
      ? importePendiente
      : null;
    estado =
      tipo === "total"
        ? "Pagado 100%"
        : tipo === "reserva50"
          ? "Reserva 50%"
          : null;
  }

  // Busca la fila de pago por stripe_id (la sesión creada al generar el enlace).
  const { data: pago, error: eBuscar } = await supabase
    .from("pagos")
    .select("id,lead_id")
    .eq("stripe_id", session.id)
    .maybeSingle();

  if (eBuscar) {
    throw new Error(`No se pudo buscar el pago: ${eBuscar.message}`);
  }

  if (!pago) {
    // No hay fila que coincida: lo dejamos en el log pero devolvemos 200 para
    // que Stripe no reintente en bucle un evento que no podemos casar.
    console.error(
      `[stripe webhook] Pago no encontrado para stripe_id=${session.id} (payment_status=${session.payment_status}).`
    );
    return;
  }

  const { error: eUpd } = await supabase
    .from("pagos")
    .update({
      importe_pagado: importePagadoFinal,
      importe_pendiente: importePendienteFinal,
      estado,
      metodo: "stripe",
      ...camposExtra,
    })
    .eq("id", pago.id);

  if (eUpd) {
    throw new Error(`No se pudo actualizar el pago: ${eUpd.message}`);
  }

  // El cliente ha pagado: la mudanza queda reservada.
  const leadObjetivo = leadId ?? pago.lead_id;
  if (leadObjetivo) {
    const { error: eLead } = await supabase
      .from("leads")
      .update({ estado_comercial: "Reservado" })
      .eq("id", leadObjetivo);
    if (eLead) {
      throw new Error(`No se pudo actualizar el lead: ${eLead.message}`);
    }

    // Y se crea su operación en el calendario. Es un extra sobre la confirmación
    // del pago: si algo falla lo registramos, pero NO propagamos el error (no
    // queremos que Stripe reintente ni que el pago quede sin confirmar por esto).
    const presupuestoId = metadata.presupuesto_id ?? null;
    try {
      await crearOperacionSiNoExiste(supabase, leadObjetivo, presupuestoId);
    } catch (err) {
      console.error(
        `[stripe webhook] No se pudo crear la operación para lead=${leadObjetivo}:`,
        err
      );
    }
  }

  console.log(
    `[stripe webhook] Pago confirmado (${estado}) para stripe_id=${session.id}, lead=${leadObjetivo}.`
  );
}

// Crea la operación (mudanza planificable) de un lead recién reservado, salvo
// que ya exista una para ese lead. La comprobación previa por lead_id evita
// duplicados si Stripe reintenta el evento o si el mismo lead paga dos veces.
type SupabaseAdmin = ReturnType<typeof getSupabaseAdmin>;

async function crearOperacionSiNoExiste(
  supabase: SupabaseAdmin,
  leadId: string,
  presupuestoId: string | null
) {
  const { data: existente, error: eExiste } = await supabase
    .from("operaciones")
    .select("id")
    .eq("lead_id", leadId)
    .limit(1)
    .maybeSingle();
  if (eExiste) {
    throw new Error(`No se pudo comprobar operaciones existentes: ${eExiste.message}`);
  }
  if (existente) {
    console.log(
      `[stripe webhook] La operación para lead=${leadId} ya existe (${existente.id}); no se duplica.`
    );
    return;
  }

  // El volumen parte del lead; el volumen del presupuesto (si hay) manda.
  const { data: lead } = await supabase
    .from("leads")
    .select("volumen_estimado_m3")
    .eq("id", leadId)
    .maybeSingle();

  let volumen: number | null = lead?.volumen_estimado_m3 ?? null;
  let vehiculoTexto: string | null = null;
  // La fecha de la operación viene de la FECHA DE LA MUDANZA del presupuesto que
  // se está pagando (ya no de fecha_deseada del lead, que la web pública ya no
  // pide). Si el presupuesto no tiene fecha, la operación se crea sin fecha y va
  // a la tira de "sin fecha asignada".
  let fechaMudanza: string | null = null;

  if (presupuestoId) {
    const { data: presu } = await supabase
      .from("presupuestos")
      .select("vehiculo,volumen_m3,fecha_mudanza")
      .eq("id", presupuestoId)
      .maybeSingle();
    if (presu) {
      if (presu.volumen_m3 !== null && presu.volumen_m3 !== undefined) {
        volumen = presu.volumen_m3;
      }
      vehiculoTexto = presu.vehiculo ?? null;
      fechaMudanza = presu.fecha_mudanza ?? null;
    }
  }

  // Casa el tipo de vehículo del presupuesto (texto) con la tabla vehiculos.
  let vehiculoId: string | null = null;
  if (vehiculoTexto) {
    const { data: veh } = await supabase
      .from("vehiculos")
      .select("id")
      .eq("tipo", vehiculoTexto)
      .limit(1)
      .maybeSingle();
    vehiculoId = veh?.id ?? null;
  }

  const { error: eIns } = await supabase.from("operaciones").insert({
    lead_id: leadId,
    fecha: fechaMudanza,
    hora: null,
    vehiculo_id: vehiculoId,
    operarios_ids: [],
    estado_operativo: "Sin planificar",
    volumen_m3: volumen,
    notas: null,
  });
  if (eIns) {
    throw new Error(`No se pudo insertar la operación: ${eIns.message}`);
  }

  console.log(`[stripe webhook] Operación creada para lead=${leadId}.`);
}
