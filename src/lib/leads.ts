// Estados comerciales del lead. Fuente única para filtro y selector.
export const ESTADOS_COMERCIALES = [
  "Nuevo",
  "Contactado",
  "Presupuesto pendiente",
  "Presupuesto enviado",
  "Negociación",
  "Reservado",
  "Perdido",
  "Cancelado",
] as const;

export type EstadoComercial = (typeof ESTADOS_COMERCIALES)[number];

export function esEstadoComercial(value: unknown): value is EstadoComercial {
  return (
    typeof value === "string" &&
    (ESTADOS_COMERCIALES as readonly string[]).includes(value)
  );
}

// Fila de la tabla `leads` con los nombres de columna reales de Supabase.
export type Lead = {
  id: string;
  creado_en: string | null;
  nombre: string | null;
  telefono: string | null;
  email: string | null;
  origen_direccion: string | null;
  origen_planta: string | null;
  origen_ascensor: boolean | null;
  destino_direccion: string | null;
  destino_planta: string | null;
  destino_ascensor: boolean | null;
  fecha_deseada: string | null;
  tamano_aprox: string | null;
  volumen_estimado_m3: number | null;
  precio_aprox_min: number | null;
  precio_aprox_max: number | null;
  estado_comercial: string | null;
  via_entrada: string | null;
  notas: string | null;
};

// --- Helpers de formato (es-ES) ---

export function formatFecha(value: string | null | undefined): string {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export function formatFechaHora(value: string | null | undefined): string {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatPrecio(value: number | null | undefined): string {
  if (value === null || value === undefined) return "—";
  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatRangoPrecio(
  min: number | null | undefined,
  max: number | null | undefined
): string {
  const hasMin = min !== null && min !== undefined;
  const hasMax = max !== null && max !== undefined;
  if (!hasMin && !hasMax) return "—";
  if (hasMin && hasMax) return `${formatPrecio(min)} – ${formatPrecio(max)}`;
  return formatPrecio(hasMin ? min : max);
}

export function formatVolumen(value: number | null | undefined): string {
  if (value === null || value === undefined) return "—";
  return `${new Intl.NumberFormat("es-ES", {
    maximumFractionDigits: 1,
  }).format(value)} m³`;
}

export function formatAscensor(value: boolean | null | undefined): string {
  if (value === null || value === undefined) return "—";
  return value ? "Sí" : "No";
}

export function textoODash(value: string | null | undefined): string {
  const v = (value ?? "").trim();
  return v.length > 0 ? v : "—";
}

// Ruta resumida "origen → destino" para la tabla, truncando cada extremo.
export function formatRuta(
  origen: string | null | undefined,
  destino: string | null | undefined,
  max = 24
): string {
  const trunc = (s: string) =>
    s.length > max ? `${s.slice(0, max - 1)}…` : s;
  const o = (origen ?? "").trim();
  const d = (destino ?? "").trim();
  if (!o && !d) return "—";
  return `${o ? trunc(o) : "—"} → ${d ? trunc(d) : "—"}`;
}
