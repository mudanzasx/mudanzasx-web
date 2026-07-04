"use server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { formatFecha, formatPrecio, formatVolumen, textoODash } from "@/lib/leads";
import {
  enviarEmailResumen,
  enviarEmailValoracion,
  type ResumenProducto,
} from "@/lib/email";

export type EnviarResult =
  | { ok: true; email: string }
  | { ok: false; error: string };

async function requireUser() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, user };
}

// Estructura mínima del snapshot jsonb del presupuesto (solo lo que necesitamos).
type DetalleSnapshot = {
  productos?: { nombre?: unknown; cantidad?: unknown }[];
} | null;

// Envía al cliente el resumen del servicio (presupuesto). Recupera los datos del
// presupuesto y del lead; comprueba que el cliente tenga email antes de enviar.
export async function enviarResumenPresupuesto(
  presupuestoId: string
): Promise<EnviarResult> {
  const { supabase, user } = await requireUser();
  if (!user) return { ok: false, error: "Sesión no válida." };

  const { data: presu } = await supabase
    .from("presupuestos")
    .select(
      "id,lead_id,precio_final,vehiculo,volumen_m3,fecha_mudanza,detalle_objetos"
    )
    .eq("id", presupuestoId)
    .maybeSingle();
  if (!presu) return { ok: false, error: "No se encontró el presupuesto." };

  const { data: lead } = await supabase
    .from("leads")
    .select("nombre,email,origen_direccion,destino_direccion")
    .eq("id", String(presu.lead_id))
    .maybeSingle();

  const email = (lead?.email ?? "").trim();
  if (!email) {
    return { ok: false, error: "Este cliente no tiene email registrado." };
  }

  // Productos destacables del snapshot (si el formato lo incluye).
  const detalle = presu.detalle_objetos as DetalleSnapshot;
  const productos: ResumenProducto[] = Array.isArray(detalle?.productos)
    ? detalle!.productos
        .map((p) => ({
          nombre: String(p?.nombre ?? "").trim(),
          cantidad: Math.max(1, Math.floor(Number(p?.cantidad) || 1)),
        }))
        .filter((p) => p.nombre !== "")
    : [];

  const res = await enviarEmailResumen({
    para: email,
    nombre: (lead?.nombre ?? "").trim() || "cliente",
    datos: {
      origen: textoODash(lead?.origen_direccion),
      destino: textoODash(lead?.destino_direccion),
      fechaTexto: presu.fecha_mudanza ? formatFecha(presu.fecha_mudanza) : null,
      volumenTexto: formatVolumen(presu.volumen_m3),
      vehiculo: textoODash(presu.vehiculo),
      precioTexto: formatPrecio(presu.precio_final),
      productos,
    },
  });
  if (!res.ok) return { ok: false, error: res.error };
  return { ok: true, email };
}

// Envía al cliente la petición de valoración (reseña de Google). Comprueba email.
export async function pedirValoracion(leadId: string): Promise<EnviarResult> {
  const { supabase, user } = await requireUser();
  if (!user) return { ok: false, error: "Sesión no válida." };

  const { data: lead } = await supabase
    .from("leads")
    .select("nombre,email")
    .eq("id", leadId)
    .maybeSingle();
  if (!lead) return { ok: false, error: "No se encontró el cliente." };

  const email = (lead.email ?? "").trim();
  if (!email) {
    return { ok: false, error: "Este cliente no tiene email registrado." };
  }

  const res = await enviarEmailValoracion({
    para: email,
    nombre: (lead.nombre ?? "").trim() || "cliente",
  });
  if (!res.ok) return { ok: false, error: res.error };
  return { ok: true, email };
}
