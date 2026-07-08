"use server";

import { requireAdmin } from "@/lib/auth";
import { formatFecha, formatPrecio, formatVolumen, textoODash } from "@/lib/leads";
import {
  enviarEmailResumen,
  enviarEmailValoracion,
  type ResumenProducto,
} from "@/lib/email";

export type EnviarResult =
  | { ok: true; email: string }
  | { ok: false; error: string };

// Estructura mínima del snapshot jsonb del presupuesto (solo lo que necesitamos).
type DetalleSnapshot = {
  objetos?: {
    cantidad?: unknown;
    interruptores?: {
      desmontaje?: unknown;
      montaje?: unknown;
      film?: unknown;
      burbujas?: unknown;
      punto_limpio?: unknown;
    } | null;
  }[];
  productos?: { nombre?: unknown; cantidad?: unknown }[];
  resumen?: { duracion_total_h?: unknown } | null;
} | null;

// Duración amable para el cliente: "unas X horas" (o "aproximadamente 1 hora").
function textoDuracion(horas: unknown): string | null {
  const h = Number(horas);
  if (!Number.isFinite(h) || h <= 0) return null;
  const redondeada = Math.max(1, Math.round(h));
  return redondeada === 1 ? "aproximadamente 1 hora" : `unas ${redondeada} horas`;
}

// Envía al cliente el resumen del servicio (presupuesto). Recupera los datos del
// presupuesto y del lead; comprueba que el cliente tenga email antes de enviar.
export async function enviarResumenPresupuesto(
  presupuestoId: string
): Promise<EnviarResult> {
  const { supabase, user } = await requireAdmin();
  if (!user) return { ok: false, error: "Sesión no válida." };

  const { data: presu } = await supabase
    .from("presupuestos")
    .select(
      "id,lead_id,precio_final,volumen_m3,fecha_mudanza,detalle_objetos"
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

  const detalle = presu.detalle_objetos as DetalleSnapshot;
  const objetos = Array.isArray(detalle?.objetos) ? detalle!.objetos : [];

  // Productos vendidos (cajas, material de embalaje) del snapshot.
  const productos: ResumenProducto[] = Array.isArray(detalle?.productos)
    ? detalle!.productos
        .map((p) => ({
          nombre: String(p?.nombre ?? "").trim(),
          cantidad: Math.max(1, Math.floor(Number(p?.cantidad) || 1)),
        }))
        .filter((p) => p.nombre !== "")
    : [];

  // Total de objetos del inventario del cliente (bultos), sumando cantidades.
  const numObjetos = objetos.reduce(
    (s, o) => s + Math.max(0, Math.floor(Number(o?.cantidad) || 0)),
    0
  );

  // Servicios incluidos: se agregan a partir de los interruptores activos en
  // cualquier objeto (no se lista objeto por objeto). La carga/transporte va
  // siempre. Si el snapshot es antiguo y no trae objetos, queda solo la base.
  let hayDesmontajeMontaje = false;
  let hayEmbalaje = false;
  let hayPuntoLimpio = false;
  for (const o of objetos) {
    const sw = o?.interruptores ?? null;
    if (sw?.desmontaje || sw?.montaje) hayDesmontajeMontaje = true;
    if (sw?.film || sw?.burbujas) hayEmbalaje = true;
    if (sw?.punto_limpio) hayPuntoLimpio = true;
  }
  const servicios = ["Carga, transporte y descarga"];
  if (hayDesmontajeMontaje) servicios.push("Desmontaje y montaje de muebles");
  if (hayEmbalaje) servicios.push("Embalaje y protección");
  if (hayPuntoLimpio) servicios.push("Retirada a punto limpio");

  const res = await enviarEmailResumen({
    para: email,
    nombre: (lead?.nombre ?? "").trim(),
    datos: {
      origen: textoODash(lead?.origen_direccion),
      destino: textoODash(lead?.destino_direccion),
      fechaTexto: presu.fecha_mudanza ? formatFecha(presu.fecha_mudanza) : null,
      volumenTexto: formatVolumen(presu.volumen_m3),
      duracionTexto: textoDuracion(detalle?.resumen?.duracion_total_h),
      precioTexto: formatPrecio(presu.precio_final),
      servicios,
      numObjetos,
      productos,
    },
  });
  if (!res.ok) return { ok: false, error: res.error };
  return { ok: true, email };
}

// Envía al cliente la petición de valoración (reseña de Google). Comprueba email.
export async function pedirValoracion(leadId: string): Promise<EnviarResult> {
  const { supabase, user } = await requireAdmin();
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
    nombre: (lead.nombre ?? "").trim(),
  });
  if (!res.ok) return { ok: false, error: res.error };
  return { ok: true, email };
}
