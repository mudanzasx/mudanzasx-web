"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getStripe } from "@/lib/stripe";
import { round2 } from "@/lib/presupuesto";

export type TipoCobro = "reserva50" | "total";

export type Pago = {
  id: string;
  presupuesto_id: string | null;
  lead_id: string | null;
  importe_total: number | null;
  importe_pagado: number | null;
  importe_pendiente: number | null;
  tipo: string | null;
  estado: string | null;
  metodo: string | null;
  stripe_id: string | null;
};

export type CrearEnlaceResult =
  | { ok: true; url: string; pago: Pago }
  | { ok: false; error: string };

// Importes de cobro, SIEMPRE a partir del precio_final guardado.
// - reserva50: 50% ahora, el resto pendiente.
// - total: 95% ahora (5% de descuento), 0 pendiente.
function calcularImportes(precioFinal: number, tipo: TipoCobro) {
  if (tipo === "total") {
    const importe_a_cobrar = round2(precioFinal * 0.95);
    return { importe_a_cobrar, importe_pendiente: 0 };
  }
  const importe_a_cobrar = round2(precioFinal * 0.5);
  return {
    importe_a_cobrar,
    importe_pendiente: round2(precioFinal - importe_a_cobrar),
  };
}

async function requireUser() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, user };
}

async function origen(): Promise<string> {
  const h = await headers();
  const host = h.get("host") ?? "localhost:3000";
  const proto =
    h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}

const SELECT_PAGO =
  "id,presupuesto_id,lead_id,importe_total,importe_pagado,importe_pendiente,tipo,estado,metodo,stripe_id";

export async function crearEnlacePago(
  presupuestoId: string,
  tipo: TipoCobro
): Promise<CrearEnlaceResult> {
  const { supabase, user } = await requireUser();
  if (!user) return { ok: false, error: "Sesión no válida." };
  if (tipo !== "reserva50" && tipo !== "total")
    return { ok: false, error: "Tipo de cobro no válido." };

  // Presupuesto autoritativo: el importe se calcula desde aquí, nunca del cliente.
  const { data: presu, error: ePresu } = await supabase
    .from("presupuestos")
    .select("id,lead_id,precio_final")
    .eq("id", presupuestoId)
    .maybeSingle();
  if (ePresu || !presu)
    return { ok: false, error: "No se encontró el presupuesto." };

  const precioFinal = Number(presu.precio_final);
  if (!Number.isFinite(precioFinal) || precioFinal <= 0)
    return { ok: false, error: "El presupuesto no tiene un precio válido." };

  const leadId = String(presu.lead_id);
  const { data: lead } = await supabase
    .from("leads")
    .select("nombre,email")
    .eq("id", leadId)
    .maybeSingle();

  const { importe_a_cobrar, importe_pendiente } = calcularImportes(
    precioFinal,
    tipo
  );
  const centimos = Math.round(importe_a_cobrar * 100);
  const nombre = (lead?.nombre ?? "").trim() || "cliente";
  const concepto =
    tipo === "total"
      ? `Mudanza completa - ${nombre}`
      : `Reserva mudanza - ${nombre}`;

  const base = await origen();
  const successUrl = `${base}/admin/leads/${leadId}?pago=ok`;
  const cancelUrl = `${base}/admin/leads/${leadId}?pago=cancelado`;

  let session;
  try {
    const stripe = getStripe();
    session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "eur",
            unit_amount: centimos,
            product_data: { name: concepto },
          },
        },
      ],
      ...(lead?.email ? { customer_email: String(lead.email) } : {}),
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        lead_id: leadId,
        presupuesto_id: presupuestoId,
        tipo,
        importe_total: String(round2(precioFinal)),
        importe_a_cobrar: String(importe_a_cobrar),
        importe_pendiente: String(importe_pendiente),
      },
    });
  } catch {
    return { ok: false, error: "No se pudo crear el enlace de pago en Stripe." };
  }

  if (!session.url)
    return { ok: false, error: "Stripe no devolvió una URL de pago." };

  // Inserta o actualiza el pago de este presupuesto.
  const fila = {
    lead_id: leadId,
    presupuesto_id: presupuestoId,
    stripe_id: session.id,
    importe_total: round2(precioFinal),
    importe_pagado: 0,
    importe_pendiente,
    tipo,
    estado: "Pendiente",
    metodo: "stripe",
  };

  const { data: existente } = await supabase
    .from("pagos")
    .select("id")
    .eq("presupuesto_id", presupuestoId)
    .maybeSingle();

  let pagoRow;
  if (existente) {
    const { data, error } = await supabase
      .from("pagos")
      .update(fila)
      .eq("id", existente.id)
      .select(SELECT_PAGO)
      .single();
    if (error || !data)
      return { ok: false, error: "No se pudo registrar el pago." };
    pagoRow = data;
  } else {
    const { data, error } = await supabase
      .from("pagos")
      .insert(fila)
      .select(SELECT_PAGO)
      .single();
    if (error || !data)
      return { ok: false, error: "No se pudo registrar el pago." };
    pagoRow = data;
  }

  revalidatePath(`/admin/leads/${leadId}`);
  return { ok: true, url: session.url, pago: pagoRow as Pago };
}
