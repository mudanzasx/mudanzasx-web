// Motor de cálculo de presupuesto. Función PURA y determinista: no toca la base
// de datos ni React. La Server Action lee config_precios/vehiculos/objetos y
// llama aquí. Así el cálculo se puede verificar con un ejemplo numérico.

// Costes fijos aceptados por el spec (no viven en config_precios).
export const COSTE_PERSONAL_HORA = 15; // €/h por operario
export const COSTE_EMBALAJE_OBJETO = 8; // € material por objeto que se embala

export type ConfigPrecios = {
  margen: number;
  iva: number;
  factor_manejo_h_m3: number;
  horas_desmontaje_por_objeto: number;
  velocidad_media_kmh: number;
  buffer_operativo_h: number;
  jornada_h: number;
  km_incluidos_dia: number;
  umbral_operarios_2: number;
  umbral_operarios_3: number;
  recargo_planta_sin_ascensor: number;
  recargo_acceso_dificil: number;
  recargo_urgencia_pct: number;
  permiso_estacionamiento: number;
  recargo_objeto_riesgo_alto: number;
};

export type VehiculoCalc = {
  tipo: string;
  capacidad_util_m3: number;
  tarifa_dia: number;
  precio_km_extra: number;
  precio_km_combustible: number;
  disponible?: boolean | null;
};

// Resultado del buscador de inventario (solo lo que se muestra en el selector).
export type ObjetoBusqueda = {
  id: string | number;
  objeto: string;
  sala: string | null;
  categoria: string | null;
  volumen_m3: number;
};

// Una línea del inventario elegida, con su cantidad y sus atributos reales.
export type ObjetoLinea = {
  id: string | number;
  objeto: string;
  sala?: string | null;
  cantidad: number;
  volumen_m3: number;
  volumen_desmontado_m3: number | null;
  se_desmonta: boolean;
  necesita_embalaje: boolean;
  riesgo: number | null;
};

export type AccesosInput = {
  km_ida: number;
  origen_planta: number;
  origen_ascensor: boolean;
  destino_planta: number;
  destino_ascensor: boolean;
  acceso_dificil: boolean;
  urgencia: boolean;
  permisos: number;
};

export type PresupuestoResultado = {
  volumen_total_m3: number;
  vehiculo: string;
  viajes: number;
  operarios: number;
  horas_manejo: number;
  horas_desmontaje: number;
  horas_trayecto: number;
  horas_totales: number;
  dias: number;
  km_totales: number;
  km_extra: number;
  coste_vehiculo: number;
  coste_distancia: number;
  coste_personal: number;
  coste_embalaje: number;
  coste_extras: number;
  coste_base_sin_urgencia: number;
  recargo_urgencia_eur: number;
  coste_base: number; // coste real total (con urgencia aplicada)
  margen_eur: number;
  subtotal_con_margen: number;
  iva_eur: number;
  precio_final: number;
};

export function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

// Planta que "cuenta" para el recargo: el número de planta si NO hay ascensor;
// la planta baja (0) o cualquier planta con ascensor no suma.
function plantasSinAscensor(planta: number, ascensor: boolean): number {
  if (ascensor) return 0;
  return Math.max(0, Math.floor(planta || 0));
}

export function calcularPresupuesto(
  objetos: ObjetoLinea[],
  accesos: AccesosInput,
  config: ConfigPrecios,
  vehiculos: VehiculoCalc[]
): PresupuestoResultado {
  // --- 1. Volumen total (desmontado cuando aplica) ---
  let volumen_total = 0;
  let objetos_desmontables = 0; // contando cantidades
  let objetos_embalaje = 0;
  let objetos_riesgo_alto = 0;

  for (const o of objetos) {
    const cantidad = Math.max(0, o.cantidad || 0);
    const volUnit =
      o.se_desmonta && o.volumen_desmontado_m3 != null
        ? o.volumen_desmontado_m3
        : o.volumen_m3;
    volumen_total += volUnit * cantidad;
    if (o.se_desmonta) objetos_desmontables += cantidad;
    if (o.necesita_embalaje) objetos_embalaje += cantidad;
    if ((o.riesgo ?? 0) === 3) objetos_riesgo_alto += cantidad;
  }

  // --- 2. Vehículo y nº de viajes ---
  const usables = vehiculos.filter((v) => v.disponible !== false);
  const pool = usables.length > 0 ? usables : vehiculos;
  const porCapacidad = [...pool].sort(
    (a, b) => a.capacidad_util_m3 - b.capacidad_util_m3
  );

  const cabe = porCapacidad.find((v) => v.capacidad_util_m3 >= volumen_total);
  let vehiculo: VehiculoCalc;
  let viajes: number;
  if (cabe) {
    vehiculo = cabe;
    viajes = 1;
  } else {
    // Supera al mayor: usa el mayor y reparte en varios viajes.
    vehiculo = porCapacidad[porCapacidad.length - 1];
    viajes = Math.max(
      1,
      Math.ceil(volumen_total / vehiculo.capacidad_util_m3)
    );
  }

  // --- 3. Horas de trabajo ---
  const horas_manejo = volumen_total * config.factor_manejo_h_m3;
  const horas_desmontaje =
    objetos_desmontables * config.horas_desmontaje_por_objeto;
  const horas_trayecto =
    (accesos.km_ida * 2) / config.velocidad_media_kmh;
  const horas_totales =
    horas_manejo + horas_desmontaje + horas_trayecto + config.buffer_operativo_h;

  // --- 4. Operarios ---
  let operarios: number;
  if (volumen_total <= config.umbral_operarios_2) operarios = 2;
  else if (volumen_total <= config.umbral_operarios_3) operarios = 3;
  else operarios = 4;

  // --- 5. Días ---
  const dias = Math.max(1, Math.ceil(horas_totales / config.jornada_h));

  // --- 6. Costes ---
  const coste_vehiculo = vehiculo.tarifa_dia * dias * viajes;

  const km_totales = accesos.km_ida * 2 * viajes;
  const km_extra = Math.max(0, km_totales - config.km_incluidos_dia * dias);
  const coste_distancia =
    km_extra * vehiculo.precio_km_extra +
    km_totales * vehiculo.precio_km_combustible;

  const coste_personal = COSTE_PERSONAL_HORA * operarios * horas_totales;

  const coste_embalaje = objetos_embalaje * COSTE_EMBALAJE_OBJETO;

  const plantas_origen = plantasSinAscensor(
    accesos.origen_planta,
    accesos.origen_ascensor
  );
  const plantas_destino = plantasSinAscensor(
    accesos.destino_planta,
    accesos.destino_ascensor
  );
  const coste_extras =
    config.recargo_planta_sin_ascensor * plantas_origen +
    config.recargo_planta_sin_ascensor * plantas_destino +
    (accesos.acceso_dificil ? config.recargo_acceso_dificil : 0) +
    config.permiso_estacionamiento * Math.max(0, accesos.permisos || 0) +
    config.recargo_objeto_riesgo_alto * objetos_riesgo_alto;

  // --- 7. Coste base ---
  const coste_base_sin_urgencia =
    coste_vehiculo +
    coste_distancia +
    coste_personal +
    coste_embalaje +
    coste_extras;

  // --- 8. Urgencia ---
  const coste_base = accesos.urgencia
    ? coste_base_sin_urgencia * (1 + config.recargo_urgencia_pct)
    : coste_base_sin_urgencia;
  const recargo_urgencia_eur = coste_base - coste_base_sin_urgencia;

  // --- 9. Margen ---
  const subtotal_con_margen = coste_base * (1 + config.margen);
  const margen_eur = subtotal_con_margen - coste_base;

  // --- 10. Precio final (con IVA) ---
  const precio_final = subtotal_con_margen * (1 + config.iva);
  const iva_eur = precio_final - subtotal_con_margen;

  return {
    volumen_total_m3: volumen_total,
    vehiculo: vehiculo.tipo,
    viajes,
    operarios,
    horas_manejo,
    horas_desmontaje,
    horas_trayecto,
    horas_totales,
    dias,
    km_totales,
    km_extra,
    coste_vehiculo,
    coste_distancia,
    coste_personal,
    coste_embalaje,
    coste_extras,
    coste_base_sin_urgencia,
    recargo_urgencia_eur,
    coste_base,
    margen_eur,
    subtotal_con_margen,
    iva_eur,
    precio_final,
  };
}

// --- Ajuste manual: márgenes derivados de un precio final editado a mano ---
// No es el motor de precios; solo deriva el margen real de un precio ya calculado.
export type MargenAjustado = {
  subtotal_ajustado: number; // sin IVA
  margen_eur: number; // sobre el coste base real
  margen_pct: number; // margen / coste base * 100
  bajo_minimo: boolean; // margen < 10%
  bajo_coste: boolean; // vende por debajo de coste (pérdidas)
};

export function margenAjustado(
  precioFinalAjustado: number,
  costeBase: number,
  iva: number
): MargenAjustado {
  const subtotal_ajustado = precioFinalAjustado / (1 + iva);
  const margen_eur = subtotal_ajustado - costeBase;
  const margen_pct = costeBase > 0 ? (margen_eur / costeBase) * 100 : 0;
  return {
    subtotal_ajustado,
    margen_eur,
    margen_pct,
    bajo_minimo: margen_pct < 10,
    bajo_coste: subtotal_ajustado < costeBase,
  };
}
