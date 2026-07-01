// Operaciones = mudanzas ya reservadas que se planifican en el calendario.
// Fuente única para estados, tipos y utilidades de calendario.

export const ESTADOS_OPERATIVOS = [
  "Sin planificar",
  "Planificado",
  "Vehículo asignado",
  "Equipo asignado",
  "En curso",
  "Finalizado",
  "Incidencia",
  "Reprogramado",
] as const;

export type EstadoOperativo = (typeof ESTADOS_OPERATIVOS)[number];

export function esEstadoOperativo(value: unknown): value is EstadoOperativo {
  return (
    typeof value === "string" &&
    (ESTADOS_OPERATIVOS as readonly string[]).includes(value)
  );
}

// Fila de la tabla `operaciones` con los nombres de columna reales.
export type Operacion = {
  id: string;
  lead_id: string | null;
  fecha: string | null; // YYYY-MM-DD
  hora: string | null; // HH:MM[:SS]
  vehiculo_id: string | null;
  operarios_ids: string[] | null;
  estado_operativo: string | null;
  volumen_m3: number | null;
  notas: string | null;
};

// Marca de color SOBRIA (escala de grises) por estado. Los estados del flujo
// normal usan puntos rellenos cada vez más oscuros; los excepcionales
// (Incidencia, Reprogramado) usan punto contorneado para distinguirse sin
// recurrir a colores chillones. La leyenda del calendario lo aclara.
export function dotEstado(estado: string | null | undefined): string {
  switch (estado) {
    case "Sin planificar":
      return "bg-black/15";
    case "Planificado":
      return "bg-black/30";
    case "Vehículo asignado":
      return "bg-black/45";
    case "Equipo asignado":
      return "bg-black/60";
    case "En curso":
      return "bg-black/80";
    case "Finalizado":
      return "bg-black";
    case "Incidencia":
      return "bg-white border-2 border-black";
    case "Reprogramado":
      return "bg-white border border-black/50";
    default:
      return "bg-black/15";
  }
}

// --- Utilidades de calendario (es-ES, semana empieza en lunes) ---

export const MESES = [
  "enero",
  "febrero",
  "marzo",
  "abril",
  "mayo",
  "junio",
  "julio",
  "agosto",
  "septiembre",
  "octubre",
  "noviembre",
  "diciembre",
] as const;

export const DIAS_SEMANA = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"] as const;

export function fechaIso(year: number, month1: number, day: number): string {
  return `${year}-${String(month1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export function isoLocal(d: Date): string {
  return fechaIso(d.getFullYear(), d.getMonth() + 1, d.getDate());
}

export type DiaCalendario = {
  iso: string; // YYYY-MM-DD
  dia: number; // 1..31
  enMes: boolean; // pertenece al mes visible
  esHoy: boolean;
};

// Genera las 6 semanas (42 celdas) del mes visible, con relleno de los días
// colindantes. `month1` es 1-12. `hoyIso` marca el día de hoy.
export function construirMes(
  year: number,
  month1: number,
  hoyIso: string
): DiaCalendario[] {
  const primero = new Date(year, month1 - 1, 1);
  const jsDow = primero.getDay(); // 0 domingo .. 6 sábado
  const offset = (jsDow + 6) % 7; // lunes = 0
  const inicio = new Date(year, month1 - 1, 1 - offset);

  const dias: DiaCalendario[] = [];
  for (let i = 0; i < 42; i++) {
    const d = new Date(
      inicio.getFullYear(),
      inicio.getMonth(),
      inicio.getDate() + i
    );
    const iso = isoLocal(d);
    dias.push({
      iso,
      dia: d.getDate(),
      enMes: d.getMonth() === month1 - 1 && d.getFullYear() === year,
      esHoy: iso === hoyIso,
    });
  }
  return dias;
}

// Mes anterior / siguiente respetando el cambio de año.
export function mesAnterior(year: number, month1: number) {
  return month1 === 1
    ? { year: year - 1, month: 12 }
    : { year, month: month1 - 1 };
}

export function mesSiguiente(year: number, month1: number) {
  return month1 === 12
    ? { year: year + 1, month: 1 }
    : { year, month: month1 + 1 };
}

export function nombreMes(month1: number): string {
  return MESES[month1 - 1] ?? "";
}

// "HH:MM:SS" o "HH:MM" -> "HH:MM". Vacío -> "".
export function formatHora(value: string | null | undefined): string {
  if (!value) return "";
  const m = value.match(/^(\d{2}):(\d{2})/);
  return m ? `${m[1]}:${m[2]}` : value;
}
