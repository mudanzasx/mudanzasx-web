"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth";
import {
  calcularPresupuesto,
  margenAjustado,
  round2,
  FACTOR_APROVECHAMIENTO_DEFAULT,
  FACTOR_PARALELO_DEFAULT,
  type AccesosInput,
  type ConfigPrecios,
  type Interruptores,
  type ObjetoBusqueda,
  type ObjetoLinea,
  type ProductoBusqueda,
  type ProductoLinea,
  type PresupuestoResultado,
  type VehiculoCalc,
} from "@/lib/presupuesto";

// --- Tipos de entrada/salida ---

export type LineaObjetoInput = {
  id: string | number;
  cantidad: number;
  interruptores: Interruptores;
};
export type LineaProductoInput = { id: string | number; cantidad: number };

export type CalcularInput = {
  objetos: LineaObjetoInput[];
  productos: LineaProductoInput[];
  accesos: AccesosInput;
};

export type CalcularResultado =
  | {
      ok: true;
      resultado: PresupuestoResultado;
      detalleObjetos: ObjetoLinea[];
      detalleProductos: ProductoLinea[];
    }
  | { ok: false; error: string };

export type GuardarInput = CalcularInput & {
  leadId: string;
  presupuestoId: string | null;
  precioFinalAjustado: number | null;
  // Fecha acordada de la mudanza (YYYY-MM-DD) o null si aún no se sabe. Es el
  // origen de la fecha de la operación en el calendario (la fija el webhook al pagar).
  fechaMudanza: string | null;
};

export type GuardarResultado = { ok: true; id: string } | { ok: false; error: string };

// --- Config ---

const CLAVES_CONFIG: (keyof ConfigPrecios)[] = [
  "margen",
  "iva",
  "factor_manejo_h_m3",
  "horas_desmontaje_por_objeto",
  "horas_montaje_por_objeto",
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
  "metros_film_por_m3",
  "precio_film_metro",
  "metros_burbujas_por_m3",
  "precio_burbujas_metro",
  "coste_punto_limpio",
];

function aNumero(valor: unknown): number {
  return Number(String(valor ?? "").replace(",", "."));
}

type SupabaseServer = Awaited<ReturnType<typeof createSupabaseServerClient>>;

async function leerConfig(
  supabase: SupabaseServer
): Promise<{ config: ConfigPrecios } | { error: string }> {
  const { data, error } = await supabase
    .from("config_precios")
    .select("clave,valor");
  if (error) return { error: "No se pudo leer la configuración de precios." };

  const mapa = new Map<string, number>();
  for (const fila of data ?? []) mapa.set(String(fila.clave), aNumero(fila.valor));

  const faltan: string[] = [];
  const config = {} as ConfigPrecios;
  for (const clave of CLAVES_CONFIG) {
    const v = mapa.get(clave);
    if (v === undefined || Number.isNaN(v)) faltan.push(clave);
    else config[clave] = v;
  }
  if (faltan.length > 0)
    return { error: `Faltan parámetros en config_precios: ${faltan.join(", ")}.` };

  // Aprovechamiento del vehículo: OPCIONAL. Si la fila aún no existe (o no es un
  // valor válido en (0, 1]), se usa el valor por defecto para no romper el
  // cálculo antes del INSERT en config_precios.
  const factor = mapa.get("factor_aprovechamiento_vehiculo");
  config.factor_aprovechamiento_vehiculo =
    factor !== undefined && Number.isFinite(factor) && factor > 0 && factor <= 1
      ? factor
      : FACTOR_APROVECHAMIENTO_DEFAULT;

  // Factor de trabajo en paralelo: también OPCIONAL con valor por defecto.
  const paralelo = mapa.get("factor_paralelo");
  config.factor_paralelo =
    paralelo !== undefined &&
    Number.isFinite(paralelo) &&
    paralelo > 0 &&
    paralelo <= 1
      ? paralelo
      : FACTOR_PARALELO_DEFAULT;

  // Divisores que DEBEN ser > 0: si una fila mal editada los deja en 0, el motor
  // produciría Infinity (horas de trayecto o días). Se rechaza con error claro.
  const divisores: (keyof ConfigPrecios)[] = ["velocidad_media_kmh", "jornada_h"];
  const noPositivos = divisores.filter((k) => !(config[k] > 0));
  if (noPositivos.length > 0)
    return { error: `Parámetros que deben ser mayores que 0 en config_precios: ${noPositivos.join(", ")}.` };

  // Margen e IVA nunca negativos: una fila mal editada no debe vender bajo coste
  // ni restar impuestos.
  config.margen = Math.max(0, config.margen);
  config.iva = Math.max(0, config.iva);

  return { config };
}

async function leerVehiculos(
  supabase: SupabaseServer
): Promise<{ vehiculos: VehiculoCalc[] } | { error: string }> {
  const { data, error } = await supabase
    .from("vehiculos")
    .select(
      "tipo,capacidad_util_m3,tarifa_dia,precio_km_extra,precio_km_combustible,disponible"
    );
  if (error || !data || data.length === 0)
    return { error: "No se pudieron leer los vehículos." };
  // Solo vehículos con capacidad > 0: una capacidad 0 provocaría Infinity al
  // calcular los viajes.
  const vehiculos = data
    .map((v) => ({
      tipo: String(v.tipo),
      capacidad_util_m3: aNumero(v.capacidad_util_m3),
      tarifa_dia: aNumero(v.tarifa_dia),
      precio_km_extra: aNumero(v.precio_km_extra),
      precio_km_combustible: aNumero(v.precio_km_combustible),
      disponible: v.disponible,
    }))
    .filter((v) => v.capacidad_util_m3 > 0);
  if (vehiculos.length === 0)
    return { error: "No hay vehículos con capacidad válida (> 0)." };
  return { vehiculos };
}

// Re-lee objetos por id (autoridad del servidor sobre volúmenes/atributos).
// Los interruptores vienen del cliente (el operario los ajusta).
async function construirDetalleObjetos(
  supabase: SupabaseServer,
  lineas: LineaObjetoInput[]
): Promise<{ detalle: ObjetoLinea[] } | { error: string }> {
  if (lineas.length === 0) return { detalle: [] };
  const ids = lineas.map((l) => l.id);
  const { data, error } = await supabase
    .from("objetos")
    .select("id,sala,objeto,volumen_m3,volumen_desmontado_m3,riesgo")
    .in("id", ids);
  if (error) return { error: "No se pudieron leer los objetos seleccionados." };

  const porId = new Map(data?.map((o) => [String(o.id), o]) ?? []);
  const detalle: ObjetoLinea[] = [];
  for (const linea of lineas) {
    const o = porId.get(String(linea.id));
    if (!o) continue;
    detalle.push({
      id: o.id,
      objeto: String(o.objeto),
      sala: o.sala ?? null,
      cantidad: Math.max(1, Math.floor(Number(linea.cantidad) || 1)),
      volumen_m3: aNumero(o.volumen_m3),
      volumen_desmontado_m3:
        o.volumen_desmontado_m3 == null ? null : aNumero(o.volumen_desmontado_m3),
      riesgo: o.riesgo == null ? null : aNumero(o.riesgo),
      interruptores: {
        desmontaje: Boolean(linea.interruptores?.desmontaje),
        montaje: Boolean(linea.interruptores?.montaje),
        film: Boolean(linea.interruptores?.film),
        burbujas: Boolean(linea.interruptores?.burbujas),
        punto_limpio: Boolean(linea.interruptores?.punto_limpio),
      },
    });
  }
  return { detalle };
}

async function construirDetalleProductos(
  supabase: SupabaseServer,
  lineas: LineaProductoInput[]
): Promise<{ detalle: ProductoLinea[] } | { error: string }> {
  if (lineas.length === 0) return { detalle: [] };
  const ids = lineas.map((l) => l.id);
  const { data, error } = await supabase
    .from("productos")
    .select("id,nombre,coste_unitario,volumen_m3")
    .in("id", ids);
  if (error) return { error: "No se pudieron leer los productos seleccionados." };

  const porId = new Map(data?.map((p) => [String(p.id), p]) ?? []);
  const detalle: ProductoLinea[] = [];
  for (const linea of lineas) {
    const p = porId.get(String(linea.id));
    if (!p) continue;
    detalle.push({
      id: p.id,
      nombre: String(p.nombre),
      cantidad: Math.max(1, Math.floor(Number(linea.cantidad) || 1)),
      coste_unitario: aNumero(p.coste_unitario),
      volumen_m3: aNumero(p.volumen_m3),
    });
  }
  return { detalle };
}

function normalizarAccesos(a: AccesosInput): AccesosInput {
  return {
    km_base_origen: Math.max(0, Number(a.km_base_origen) || 0),
    km_origen_destino: Math.max(0, Number(a.km_origen_destino) || 0),
    km_destino_base: Math.max(0, Number(a.km_destino_base) || 0),
    origen_planta: Math.floor(Number(a.origen_planta) || 0),
    origen_ascensor: Boolean(a.origen_ascensor),
    destino_planta: Math.floor(Number(a.destino_planta) || 0),
    destino_ascensor: Boolean(a.destino_ascensor),
    acceso_dificil: Boolean(a.acceso_dificil),
    urgencia: Boolean(a.urgencia),
    permisos: Math.max(0, Math.floor(Number(a.permisos) || 0)),
  };
}

// --- Buscadores ---

export async function buscarObjetos(query: string): Promise<ObjetoBusqueda[]> {
  const { supabase, user } = await requireAdmin();
  if (!user) return [];
  const term = (query ?? "").trim();
  let q = supabase
    .from("objetos")
    .select("id,sala,categoria,objeto,volumen_m3,se_desmonta,necesita_embalaje,riesgo")
    .order("sala", { ascending: true })
    .order("objeto", { ascending: true })
    .limit(40);
  if (term) q = q.ilike("objeto", `%${term.replace(/[%,()]/g, " ")}%`);

  const { data, error } = await q;
  if (error || !data) return [];
  return data.map((o) => ({
    id: o.id,
    objeto: String(o.objeto),
    sala: o.sala ?? null,
    categoria: o.categoria ?? null,
    volumen_m3: aNumero(o.volumen_m3),
    se_desmonta: Boolean(o.se_desmonta),
    necesita_embalaje: Boolean(o.necesita_embalaje),
    riesgo: o.riesgo == null ? null : aNumero(o.riesgo),
  }));
}

export async function buscarProductos(query: string): Promise<ProductoBusqueda[]> {
  const { supabase, user } = await requireAdmin();
  if (!user) return [];
  const term = (query ?? "").trim();
  let q = supabase
    .from("productos")
    .select("id,nombre,coste_unitario,volumen_m3")
    .order("nombre", { ascending: true })
    .limit(40);
  if (term) q = q.ilike("nombre", `%${term.replace(/[%,()]/g, " ")}%`);

  const { data, error } = await q;
  if (error || !data) return [];
  return data.map((p) => ({
    id: p.id,
    nombre: String(p.nombre),
    coste_unitario: aNumero(p.coste_unitario),
    volumen_m3: aNumero(p.volumen_m3),
  }));
}

// --- Cálculo ---

async function calcularInterno(
  supabase: SupabaseServer,
  input: CalcularInput
): Promise<CalcularResultado> {
  if (input.objetos.length === 0 && input.productos.length === 0)
    return { ok: false, error: "Añade al menos un objeto o producto." };

  const dObj = await construirDetalleObjetos(supabase, input.objetos);
  if ("error" in dObj) return { ok: false, error: dObj.error };
  const dProd = await construirDetalleProductos(supabase, input.productos);
  if ("error" in dProd) return { ok: false, error: dProd.error };

  if (dObj.detalle.length === 0 && dProd.detalle.length === 0)
    return { ok: false, error: "Los elementos seleccionados ya no existen." };

  const cfg = await leerConfig(supabase);
  if ("error" in cfg) return { ok: false, error: cfg.error };
  const veh = await leerVehiculos(supabase);
  if ("error" in veh) return { ok: false, error: veh.error };

  const accesos = normalizarAccesos(input.accesos);
  const resultado = calcularPresupuesto(
    dObj.detalle,
    dProd.detalle,
    accesos,
    cfg.config,
    veh.vehiculos
  );
  return {
    ok: true,
    resultado,
    detalleObjetos: dObj.detalle,
    detalleProductos: dProd.detalle,
  };
}

export async function calcularPresupuestoAction(
  input: CalcularInput
): Promise<CalcularResultado> {
  const { supabase, user } = await requireAdmin();
  if (!user) return { ok: false, error: "Sesión no válida." };
  return calcularInterno(supabase, input);
}

// --- Guardado (insert o update) + actualización del lead ---

export async function guardarPresupuestoAction(
  input: GuardarInput
): Promise<GuardarResultado> {
  const { supabase, user } = await requireAdmin();
  if (!user) return { ok: false, error: "Sesión no válida." };

  // Recalcula en el servidor: nunca se confía en números del cliente.
  const calc = await calcularInterno(supabase, input);
  if (!calc.ok) return { ok: false, error: calc.error };
  const r = calc.resultado;
  const accesos = normalizarAccesos(input.accesos);

  const ajustado =
    input.precioFinalAjustado != null &&
    Number.isFinite(input.precioFinalAjustado) &&
    input.precioFinalAjustado > 0
      ? input.precioFinalAjustado
      : null;
  const precio_final = round2(ajustado ?? r.precio_final);
  const volumen_m3 = round2(r.volumen_total_m3);

  // Desglose que se guarda: debe cuadrar SIEMPRE con el precio_final real.
  //   coste_base + margen + cargo_punto_limpio + iva = precio_final
  // (el punto limpio es un pass-through fijo sin columna propia, igual que en el
  // cálculo automático). Si el operario ajusta el precio a mano, el coste base es
  // el real (no cambia al negociar) y se recalculan margen e IVA para ese precio;
  // si no, se usan los del motor.
  const costeBaseGuardado = r.coste_base;
  let margenGuardado = r.margen_eur;
  let ivaGuardado = r.iva_eur;
  if (ajustado != null) {
    const ivaRate = r.subtotal_pre_iva > 0 ? r.iva_eur / r.subtotal_pre_iva : 0;
    const m = margenAjustado(ajustado, r.coste_base, ivaRate, r.cargo_punto_limpio);
    margenGuardado = m.margen_eur;
    ivaGuardado = m.iva_eur;
  }

  // Fecha de la mudanza: opcional. Se normaliza a null si viene vacía o no es
  // una fecha ISO (YYYY-MM-DD) válida, para no meter basura en la columna date.
  const fechaMudanza =
    typeof input.fechaMudanza === "string" &&
    /^\d{4}-\d{2}-\d{2}$/.test(input.fechaMudanza.trim())
      ? input.fechaMudanza.trim()
      : null;

  // Snapshot completo para reabrir el presupuesto (Cambio 6). Desde v3 incluye
  // un `resumen` de la operación estimada (volúmenes, esfuerzo y duración) para
  // mostrarlo de un vistazo en la ficha sin recalcular.
  const detalle_objetos = {
    version: 3,
    objetos: calc.detalleObjetos,
    productos: calc.detalleProductos,
    accesos,
    resumen: {
      volumen_neto_m3: round2(r.volumen_total_m3),
      volumen_real_ocupado_m3: round2(r.volumen_real_ocupado_m3),
      horas_trabajo_persona: round2(r.horas_trabajo_persona),
      duracion_total_h: round2(r.duracion_total_h),
      dias: r.dias,
      operarios: r.operarios,
      vehiculo: r.viajes > 1 ? `${r.vehiculo} ×${r.viajes}` : r.vehiculo,
    },
  };

  const fila = {
    lead_id: input.leadId,
    detalle_objetos,
    fecha_mudanza: fechaMudanza,
    volumen_m3,
    vehiculo: r.viajes > 1 ? `${r.vehiculo} ×${r.viajes}` : r.vehiculo,
    operarios: r.operarios,
    horas: round2(r.horas_totales),
    coste_base: round2(costeBaseGuardado),
    coste_distancia: round2(r.coste_distancia),
    coste_personal: round2(r.coste_personal),
    coste_embalaje: round2(r.coste_embalaje),
    coste_extras: round2(r.coste_extras),
    margen: round2(margenGuardado),
    iva: round2(ivaGuardado),
    precio_final,
  };

  let presupuestoId = input.presupuestoId;
  if (presupuestoId) {
    const { error } = await supabase
      .from("presupuestos")
      .update(fila)
      .eq("id", presupuestoId);
    if (error) return { ok: false, error: "No se pudo actualizar el presupuesto." };
  } else {
    const { data, error } = await supabase
      .from("presupuestos")
      .insert({ ...fila, estado: "borrador" })
      .select("id")
      .single();
    if (error || !data)
      return { ok: false, error: "No se pudo guardar el presupuesto." };
    presupuestoId = String(data.id);
  }

  // Cambio 5: refleja volumen y precio en la ficha del cliente.
  await supabase
    .from("leads")
    .update({
      volumen_estimado_m3: volumen_m3,
      precio_aprox_min: precio_final,
      precio_aprox_max: precio_final,
    })
    .eq("id", input.leadId);

  revalidatePath(`/admin/leads/${input.leadId}`);
  return { ok: true, id: presupuestoId };
}
