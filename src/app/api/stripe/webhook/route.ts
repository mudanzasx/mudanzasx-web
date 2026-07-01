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
  const tipo = metadata.tipo; // 'reserva50' | 'total'
  const importeACobrar = Number(metadata.importe_a_cobrar);
  const importePendiente = Number(metadata.importe_pendiente);

  const supabase = getSupabaseAdmin();

  const estado =
    tipo === "total" ? "Pagado 100%" : tipo === "reserva50" ? "Reserva 50%" : null;

  // Busca la fila de pago por stripe_id (la sesión creada en la fase 3a).
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
      importe_pagado: Number.isFinite(importeACobrar) ? importeACobrar : null,
      importe_pendiente: Number.isFinite(importePendiente) ? importePendiente : null,
      estado,
      metodo: "stripe",
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
  }

  console.log(
    `[stripe webhook] Pago confirmado (${estado}) para stripe_id=${session.id}, lead=${leadObjetivo}.`
  );
}
