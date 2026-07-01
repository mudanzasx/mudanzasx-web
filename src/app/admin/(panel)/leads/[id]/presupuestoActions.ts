"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  calcularPresupuesto,
  round2,
  type AccesosInput,
  type ConfigPrecios,
  type ObjetoBusqueda,
  type ObjetoLinea,
  type PresupuestoResultado,
  type VehiculoCalc,
} from "@/lib/presupuesto";

// --- Tipos de entrada/salida de las acciones ---

export type LineaSeleccionada = { id: string | number; cantidad: number };

export type CalcularInput = {
  lineas: LineaSeleccionada[];
  accesos: AccesosInput;
};

export type CalcularResultado =
  | { ok: true; resultado: PresupuestoResultado; detalle: ObjetoLinea[] }
  | { ok: false; error: string };

export type GuardarInput = CalcularInput & {
  leadId: string;
  precioFinalAjustado: number | null;
};

export type GuardarResultado = { ok: true } | { ok: false; error: string };

// --- Helpers internos ---

const CLAVES_CONFIG: (keyof ConfigPrecios)[] = [
  "margen",
  "iva",
  "factor_manejo_h_m3",
  "horas_desmontaje_por_objeto",
  "velocidad_media_kmh",
  "buffer_operativo_h",
  "jornada_h",
  "km_incluidos_dia",
  "umbral_operarios_2",
  "umbral_operarios_3",
  "recargo_planta_sin_ascensor",
  "recargo_acceso_dificil",
  "recargo_urgencia_pct",
  "permiso_estacionamiento",
  "recargo_objeto_riesgo_alto",
];

function aNumero(valor: unknown): number {
  return Number(String(valor ?? "").replace(",", "."));
}

async function requireUser() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, user };
}

// Lee config_precios y valida que estén todas las claves necesarias.
async function leerConfig(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>
): Promise<{ config: ConfigPrecios } | { error: string }> {
  const { data, error } = await supabase
    .from("config_precios")
    .select("clave,valor");
  if (error) return { error: "No se pudo leer la configuración de precios." };

  const mapa = new Map<string, number>();
  for (const fila of data ?? []) {
    mapa.set(String(fila.clave), aNumero(fila.valor));
  }

  const faltan: string[] = [];
  const config = {} as ConfigPrecios;
  for (const clave of CLAVES_CONFIG) {
    const v = mapa.get(clave);
    if (v === undefined || Number.isNaN(v)) faltan.push(clave);
    else config[clave] = v;
  }
  if (faltan.length > 0) {
    return { error: `Faltan parámetros en config_precios: ${faltan.join(", ")}.` };
  }
  return { config };
}

async function leerVehiculos(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>
): Promise<{ vehiculos: VehiculoCalc[] } | { error: string }> {
  const { data, error } = await supabase
    .from("vehiculos")
    .select(
      "tipo,capacidad_util_m3,tarifa_dia,precio_km_extra,precio_km_combustible,disponible"
    );
  if (error || !data || data.length === 0)
    return { error: "No se pudieron leer los vehículos." };

  const vehiculos: VehiculoCalc[] = data.map((v) => ({
    tipo: String(v.tipo),
    capacidad_util_m3: aNumero(v.capacidad_util_m3),
    tarifa_dia: aNumero(v.tarifa_dia),
    precio_km_extra: aNumero(v.precio_km_extra),
    precio_km_combustible: aNumero(v.precio_km_combustible),
    disponible: v.disponible,
  }));
  return { vehiculos };
}

// Re-lee los objetos por id desde la base (autoridad del servidor sobre
// volúmenes/atributos; el cliente solo aporta id + cantidad).
async function construirDetalle(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  lineas: LineaSeleccionada[]
): Promise<{ detalle: ObjetoLinea[] } | { error: string }> {
  const ids = lineas.map((l) => l.id);
  if (ids.length === 0) return { error: "Añade al menos un objeto." };

  const { data, error } = await supabase
    .from("objetos")
    .select(
      "id,sala,objeto,volumen_m3,volumen_desmontado_m3,se_desmonta,riesgo,necesita_embalaje"
    )
    .in("id", ids);
  if (error) return { error: "No se pudieron leer los objetos seleccionados." };

  const porId = new Map(data?.map((o) => [String(o.id), o]) ?? []);
  const detalle: ObjetoLinea[] = [];
  for (const linea of lineas) {
    const o = porId.get(String(linea.id));
    if (!o) continue;
    const cantidad = Math.max(1, Math.floor(Number(linea.cantidad) || 1));
    detalle.push({
      id: o.id,
      objeto: String(o.objeto),
      sala: o.sala ?? null,
      cantidad,
      volumen_m3: aNumero(o.volumen_m3),
      volumen_desmontado_m3:
        o.volumen_desmontado_m3 == null ? null : aNumero(o.volumen_desmontado_m3),
      se_desmonta: Boolean(o.se_desmonta),
      necesita_embalaje: Boolean(o.necesita_embalaje),
      riesgo: o.riesgo == null ? null : aNumero(o.riesgo),
    });
  }
  if (detalle.length === 0)
    return { error: "Los objetos seleccionados ya no existen." };
  return { detalle };
}

// Normaliza los accesos que llegan del cliente a números/booleanos seguros.
function normalizarAccesos(a: AccesosInput): AccesosInput {
  return {
    km_ida: Math.max(0, Number(a.km_ida) || 0),
    origen_planta: Math.floor(Number(a.origen_planta) || 0),
    origen_ascensor: Boolean(a.origen_ascensor),
    destino_planta: Math.floor(Number(a.destino_planta) || 0),
    destino_ascensor: Boolean(a.destino_ascensor),
    acceso_dificil: Boolean(a.acceso_dificil),
    urgencia: Boolean(a.urgencia),
    permisos: Math.max(0, Math.floor(Number(a.permisos) || 0)),
  };
}

// --- Acciones públicas ---

// Buscador del inventario por nombre de objeto.
export async function buscarObjetos(query: string): Promise<ObjetoBusqueda[]> {
  const { supabase, user } = await requireUser();
  if (!user) return [];

  const term = (query ?? "").trim();
  let q = supabase
    .from("objetos")
    .select("id,sala,categoria,objeto,volumen_m3")
    .order("sala", { ascending: true })
    .order("objeto", { ascending: true })
    .limit(40);

  if (term) {
    const safe = term.replace(/[%,()]/g, " ");
    q = q.ilike("objeto", `%${safe}%`);
  }

  const { data, error } = await q;
  if (error || !data) return [];
  return data.map((o) => ({
    id: o.id,
    objeto: String(o.objeto),
    sala: o.sala ?? null,
    categoria: o.categoria ?? null,
    volumen_m3: aNumero(o.volumen_m3),
  }));
}

export async function calcularPresupuestoAction(
  input: CalcularInput
): Promise<CalcularResultado> {
  const { supabase, user } = await requireUser();
  if (!user) return { ok: false, error: "Sesión no válida." };

  const det = await construirDetalle(supabase, input.lineas);
  if ("error" in det) return { ok: false, error: det.error };

  const cfg = await leerConfig(supabase);
  if ("error" in cfg) return { ok: false, error: cfg.error };

  const veh = await leerVehiculos(supabase);
  if ("error" in veh) return { ok: false, error: veh.error };

  const accesos = normalizarAccesos(input.accesos);
  const resultado = calcularPresupuesto(
    det.detalle,
    accesos,
    cfg.config,
    veh.vehiculos
  );
  return { ok: true, resultado, detalle: det.detalle };
}

export async function guardarPresupuestoAction(
  input: GuardarInput
): Promise<GuardarResultado> {
  const { supabase, user } = await requireUser();
  if (!user) return { ok: false, error: "Sesión no válida." };

  // Recalcula en el servidor: nunca se confía en números del cliente.
  const det = await construirDetalle(supabase, input.lineas);
  if ("error" in det) return { ok: false, error: det.error };

  const cfg = await leerConfig(supabase);
  if ("error" in cfg) return { ok: false, error: cfg.error };

  const veh = await leerVehiculos(supabase);
  if ("error" in veh) return { ok: false, error: veh.error };

  const accesos = normalizarAccesos(input.accesos);
  const r = calcularPresupuesto(det.detalle, accesos, cfg.config, veh.vehiculos);

  // Precio final: el ajustado a mano si es válido, si no el calculado.
  const ajustado =
    input.precioFinalAjustado != null &&
    Number.isFinite(input.precioFinalAjustado) &&
    input.precioFinalAjustado > 0
      ? input.precioFinalAjustado
      : null;
  const precio_final = round2(ajustado ?? r.precio_final);

  const { error } = await supabase.from("presupuestos").insert({
    lead_id: input.leadId,
    detalle_objetos: det.detalle,
    volumen_m3: round2(r.volumen_total_m3),
    vehiculo: r.viajes > 1 ? `${r.vehiculo} ×${r.viajes}` : r.vehiculo,
    operarios: r.operarios,
    horas: round2(r.horas_totales),
    coste_base: round2(r.coste_base),
    coste_distancia: round2(r.coste_distancia),
    coste_personal: round2(r.coste_personal),
    coste_embalaje: round2(r.coste_embalaje),
    coste_extras: round2(r.coste_extras),
    margen: round2(r.margen_eur),
    iva: round2(r.iva_eur),
    precio_final,
    estado: "borrador",
  });

  if (error) {
    return { ok: false, error: "No se pudo guardar el presupuesto." };
  }

  revalidatePath(`/admin/leads/${input.leadId}`);
  return { ok: true };
}
