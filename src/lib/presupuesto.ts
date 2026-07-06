// Motor de cálculo de presupuesto. Función PURA y determinista: no toca la base
// de datos ni React. La Server Action lee config_precios/vehiculos/objetos/
// productos y llama aquí. Así el cálculo se puede verificar con un ejemplo.

// El coste de personal es fijo (spec): 15 €/h por operario.
export const COSTE_PERSONAL_HORA = 15;

export type ConfigPrecios = {
  margen: number;
  iva: number;
  factor_manejo_h_m3: number;
  horas_desmontaje_por_objeto: number;
  horas_montaje_por_objeto: number;
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
  metros_film_por_m3: number;
  precio_film_metro: number;
  metros_burbujas_por_m3: number;
  precio_burbujas_metro: number;
  coste_punto_limpio: number;
  // Fracción del volumen del vehículo realmente aprovechable (0-1). En un camión
  // real quedan huecos entre objetos, muebles irregulares y pasillos, así que el
  // volumen neto de la carga ocupa más espacio del que suma. Ej. 0.8 = se
  // aprovecha el 80%, luego el espacio ocupado = volumen_neto / 0.8.
  factor_aprovechamiento_vehiculo: number;
  // Eficiencia del trabajo en paralelo (0-1). El equipo no reparte el esfuerzo
  // de forma perfecta (esperas, tareas a dos/tres manos), así que la duración
  // real = horas-persona / (operarios × factor_paralelo). Ej. 0.8 = 80%.
  factor_paralelo: number;
};

// Valores por defecto si config_precios aún no tiene la fila (evitan romper el
// cálculo antes del INSERT). 0.8 = se aprovecha el 80% del vehículo / del
// trabajo en paralelo.
export const FACTOR_APROVECHAMIENTO_DEFAULT = 0.8;
export const FACTOR_PARALELO_DEFAULT = 0.8;

export type VehiculoCalc = {
  tipo: string;
  capacidad_util_m3: number;
  tarifa_dia: number;
  precio_km_extra: number;
  precio_km_combustible: number;
  disponible?: boolean | null;
};

// Interruptores por objeto del inventario (sustituyen las reglas automáticas).
export type Interruptores = {
  desmontaje: boolean;
  montaje: boolean;
  film: boolean;
  burbujas: boolean;
  punto_limpio: boolean;
};

// Resultado del buscador de inventario (cliente ya tiene → solo volumen).
export type ObjetoBusqueda = {
  id: string | number;
  objeto: string;
  sala: string | null;
  categoria: string | null;
  volumen_m3: number;
  se_desmonta: boolean;
  necesita_embalaje: boolean;
  riesgo: number | null;
};

// Resultado del buscador de productos (los vendemos → volumen + coste).
export type ProductoBusqueda = {
  id: string | number;
  nombre: string;
  coste_unitario: number;
  volumen_m3: number;
};

// Línea de inventario con cantidad, atributos reales e interruptores.
export type ObjetoLinea = {
  id: string | number;
  objeto: string;
  sala: string | null;
  cantidad: number;
  volumen_m3: number;
  volumen_desmontado_m3: number | null;
  riesgo: number | null;
  interruptores: Interruptores;
};

// Línea de producto vendido.
export type ProductoLinea = {
  id: string | number;
  nombre: string;
  cantidad: number;
  coste_unitario: number;
  volumen_m3: number;
};

export type AccesosInput = {
  km_base_origen: number;
  km_origen_destino: number;
  km_destino_base: number;
  origen_planta: number;
  origen_ascensor: boolean;
  destino_planta: number;
  destino_ascensor: boolean;
  acceso_dificil: boolean;
  urgencia: boolean;
  permisos: number;
};

export type PresupuestoResultado = {
  volumen_total_m3: number; // volumen NETO de la carga (objetos + productos)
  volumen_objetos_m3: number;
  volumen_productos_m3: number;
  // Espacio realmente ocupado en el vehículo = volumen neto / aprovechamiento.
  // Es el que decide vehículo y viajes; NO el neto.
  volumen_real_ocupado_m3: number;
  factor_aprovechamiento_vehiculo: number;
  vehiculo: string;
  viajes: number;
  operarios: number;
  horas_manejo: number;
  horas_desmontaje: number;
  horas_montaje: number;
  horas_trayecto: number;
  horas_totales: number; // horas-persona sobre las que se paga el personal (sin cambios)
  // Esfuerzo de manipulación (manejo + desmontaje + montaje), en horas-persona.
  horas_trabajo_persona: number;
  // Duración REAL de la mudanza (equipo en paralelo + trayecto + buffer).
  duracion_trabajo_h: number; // solo la parte de manipulación, ya repartida
  duracion_total_h: number; // manipulación repartida + trayecto + buffer
  factor_paralelo: number;
  dias: number;
  km_ruta: number;
  km_totales: number;
  km_extra: number;
  coste_vehiculo: number;
  coste_distancia: number;
  coste_personal: number;
  coste_embalaje: number;
  coste_productos: number;
  coste_extras: number;
  coste_base_sin_urgencia: number;
  recargo_urgencia_eur: number;
  coste_base: number; // coste real total (con urgencia)
  margen_eur: number;
  subtotal_con_margen: number;
  cargo_punto_limpio: number; // precio fijo, sin margen, antes de IVA
  subtotal_pre_iva: number;
  iva_eur: number;
  precio_final: number;
};

export function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

// Planta que cuenta para el recargo: el nº de planta si NO hay ascensor; la
// planta baja (0) o cualquier planta con ascensor no suma.
function plantasSinAscensor(planta: number, ascensor: boolean): number {
  if (ascensor) return 0;
  return Math.max(0, Math.floor(planta || 0));
}

export function calcularPresupuesto(
  objetos: ObjetoLinea[],
  productos: ProductoLinea[],
  accesos: AccesosInput,
  config: ConfigPrecios,
  vehiculos: VehiculoCalc[]
): PresupuestoResultado {
  // --- 1. Volumen ---
  let volumen_objetos = 0;
  let horas_desmontaje = 0;
  let horas_montaje = 0;
  let coste_embalaje = 0;
  let objetos_riesgo_alto = 0; // contando cantidades (riesgo = 3)
  let hay_punto_limpio = false;

  for (const o of objetos) {
    const cantidad = Math.max(0, o.cantidad || 0);
    const sw = o.interruptores;

    // Volumen: desmontado solo si el interruptor Desmontaje está activo
    // y existe volumen_desmontado_m3; si no, volumen normal.
    const volUnit =
      sw.desmontaje && o.volumen_desmontado_m3 != null
        ? o.volumen_desmontado_m3
        : o.volumen_m3;
    volumen_objetos += volUnit * cantidad;

    if (sw.desmontaje) horas_desmontaje += cantidad * config.horas_desmontaje_por_objeto;
    if (sw.montaje) horas_montaje += cantidad * config.horas_montaje_por_objeto;

    if (sw.film) {
      coste_embalaje +=
        cantidad * (o.volumen_m3 * config.metros_film_por_m3 * config.precio_film_metro);
    }
    if (sw.burbujas) {
      coste_embalaje +=
        cantidad *
        (o.volumen_m3 * config.metros_burbujas_por_m3 * config.precio_burbujas_metro);
    }

    if ((o.riesgo ?? 0) === 3) objetos_riesgo_alto += cantidad;
    if (sw.punto_limpio) hay_punto_limpio = true;
  }

  let volumen_productos = 0;
  let coste_productos = 0;
  for (const p of productos) {
    const cantidad = Math.max(0, p.cantidad || 0);
    volumen_productos += p.volumen_m3 * cantidad;
    coste_productos += p.coste_unitario * cantidad;
  }

  const volumen_total = volumen_objetos + volumen_productos; // NETO

  // Espacio real ocupado en el vehículo: el volumen neto no se aprovecha al 100%
  // (huecos, muebles irregulares, pasillos). Se infla dividiendo por el factor
  // de aprovechamiento (ej. 0.8 → ×1.25). Este es el volumen que decide vehículo
  // y viajes; el neto se sigue usando para manejo y operarios (dependen de los
  // objetos reales, no del aire).
  const factor =
    config.factor_aprovechamiento_vehiculo &&
    config.factor_aprovechamiento_vehiculo > 0
      ? config.factor_aprovechamiento_vehiculo
      : FACTOR_APROVECHAMIENTO_DEFAULT;
  const volumen_real_ocupado = volumen_total / factor;

  // --- 2. Vehículo y nº de viajes (sobre el volumen REAL ocupado) ---
  const usables = vehiculos.filter((v) => v.disponible !== false);
  const pool = usables.length > 0 ? usables : vehiculos;
  const porCapacidad = [...pool].sort(
    (a, b) => a.capacidad_util_m3 - b.capacidad_util_m3
  );
  const cabe = porCapacidad.find(
    (v) => v.capacidad_util_m3 >= volumen_real_ocupado
  );
  let vehiculo: VehiculoCalc;
  let viajes: number;
  if (cabe) {
    vehiculo = cabe;
    viajes = 1;
  } else {
    vehiculo = porCapacidad[porCapacidad.length - 1];
    viajes = Math.max(
      1,
      Math.ceil(volumen_real_ocupado / vehiculo.capacidad_util_m3)
    );
  }

  // --- 3. Horas (manejo sobre el volumen NETO: manipular depende de los objetos) ---
  const horas_manejo = volumen_total * config.factor_manejo_h_m3;
  const km_ruta =
    accesos.km_base_origen + accesos.km_origen_destino + accesos.km_destino_base;
  const km_totales = km_ruta * viajes;
  const horas_trayecto = km_totales / config.velocidad_media_kmh;
  const horas_totales =
    horas_manejo +
    horas_desmontaje +
    horas_montaje +
    horas_trayecto +
    config.buffer_operativo_h;

  // --- 4. Operarios ---
  let operarios: number;
  if (volumen_total <= config.umbral_operarios_2) operarios = 2;
  else if (volumen_total <= config.umbral_operarios_3) operarios = 3;
  else operarios = 4;

  // --- 5. Duración real de la mudanza y días de vehículo ---
  // El equipo trabaja EN PARALELO: el esfuerzo de manipulación (horas-persona)
  // se reparte entre los operarios con una eficiencia (factor_paralelo). El
  // TRAYECTO no se paraleliza (lo conduce el camión una sola vez) ni el buffer.
  //   duración_trabajo = horas-persona / (operarios × factor_paralelo)
  //   duración_total   = duración_trabajo + trayecto + buffer
  // OJO: el coste de personal NO usa esto; sigue sobre horas_totales (esfuerzo).
  const horas_trabajo_persona = horas_manejo + horas_desmontaje + horas_montaje;
  const fParalelo =
    config.factor_paralelo && config.factor_paralelo > 0
      ? config.factor_paralelo
      : FACTOR_PARALELO_DEFAULT;
  const duracion_trabajo = horas_trabajo_persona / (operarios * fParalelo);
  const duracion_total =
    duracion_trabajo + horas_trayecto + config.buffer_operativo_h;
  // Los días de vehículo se cuentan sobre la DURACIÓN REAL, no sobre las
  // horas-persona (que están infladas por el trabajo secuencial).
  const dias = Math.max(1, Math.ceil(duracion_total / config.jornada_h));

  // --- 6. Líneas de coste ---
  const coste_vehiculo = vehiculo.tarifa_dia * dias * viajes;

  const km_extra = Math.max(0, km_totales - config.km_incluidos_dia * dias);
  const coste_distancia =
    km_extra * vehiculo.precio_km_extra +
    km_totales * vehiculo.precio_km_combustible;

  const coste_personal = COSTE_PERSONAL_HORA * operarios * horas_totales;

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
    coste_productos +
    coste_extras;

  // --- 8. Urgencia ---
  const coste_base = accesos.urgencia
    ? coste_base_sin_urgencia * (1 + config.recargo_urgencia_pct)
    : coste_base_sin_urgencia;
  const recargo_urgencia_eur = coste_base - coste_base_sin_urgencia;

  // --- 9. Margen ---
  const subtotal_con_margen = coste_base * (1 + config.margen);
  const margen_eur = subtotal_con_margen - coste_base;

  // --- 10. Punto limpio: precio fijo, DESPUÉS del margen, sin margen ---
  const cargo_punto_limpio = hay_punto_limpio ? config.coste_punto_limpio : 0;
  const subtotal_pre_iva = subtotal_con_margen + cargo_punto_limpio;

  // --- 11. IVA ---
  const precio_final = subtotal_pre_iva * (1 + config.iva);
  const iva_eur = precio_final - subtotal_pre_iva;

  return {
    volumen_total_m3: volumen_total,
    volumen_objetos_m3: volumen_objetos,
    volumen_productos_m3: volumen_productos,
    volumen_real_ocupado_m3: volumen_real_ocupado,
    factor_aprovechamiento_vehiculo: factor,
    vehiculo: vehiculo.tipo,
    viajes,
    operarios,
    horas_manejo,
    horas_desmontaje,
    horas_montaje,
    horas_trayecto,
    horas_totales,
    horas_trabajo_persona,
    duracion_trabajo_h: duracion_trabajo,
    duracion_total_h: duracion_total,
    factor_paralelo: fParalelo,
    dias,
    km_ruta,
    km_totales,
    km_extra,
    coste_vehiculo,
    coste_distancia,
    coste_personal,
    coste_embalaje,
    coste_productos,
    coste_extras,
    coste_base_sin_urgencia,
    recargo_urgencia_eur,
    coste_base,
    margen_eur,
    subtotal_con_margen,
    cargo_punto_limpio,
    subtotal_pre_iva,
    iva_eur,
    precio_final,
  };
}

// --- Ajuste manual: márgenes derivados de un precio final editado a mano ---
export type MargenAjustado = {
  subtotal_ajustado: number; // sin IVA
  margen_eur: number;
  margen_pct: number;
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

// Valores por defecto de los interruptores al añadir un objeto (Cambio 2).
export function interruptoresPorDefecto(o: {
  se_desmonta: boolean;
  necesita_embalaje: boolean;
  riesgo: number | null;
}): Interruptores {
  return {
    desmontaje: o.se_desmonta === true,
    montaje: o.se_desmonta === true,
    film: o.necesita_embalaje === true,
    burbujas: (o.riesgo ?? 0) >= 3,
    punto_limpio: false,
  };
}
