// Pastilla del estado. Por defecto es neutra (gris), como el resto del panel.
// Con `colorize` se aplica un semáforo sobrio a los estados COMERCIALES del lead
// (gris/ámbar/verde/rojo). Los estados de presupuesto/pago se dejan neutros para
// no alterar su aspecto.

type Tono = "neutro" | "gris" | "ambar" | "verde" | "azul" | "rojo";

// Mapa de estado comercial -> tono. Basado en ESTADOS_COMERCIALES:
// Nuevo (recién entrado) → gris; intermedios (contacto/presupuesto/negociación)
// → ámbar; Reservado (cerrado con éxito) → verde; Finalizado (mudanza ya hecha)
// → azul apagado (distinto del verde de Reservado); Perdido/Cancelado → rojo.
const ESTADO_TONO: Record<string, Tono> = {
  Nuevo: "gris",
  Contactado: "ambar",
  "Presupuesto pendiente": "ambar",
  "Presupuesto enviado": "ambar",
  Negociación: "ambar",
  Reservado: "verde",
  Finalizado: "azul",
  Perdido: "rojo",
  Cancelado: "rojo",
};

const TONO_CLASES: Record<Tono, { badge: string; dot: string }> = {
  // Tonos neutros con relleno blanco + hairline: se leen como pastilla nítida
  // tanto sobre la tarjeta blanca como sobre el fondo gris del panel (un relleno
  // gris se fundiría con el gris de la página). Los tonos del semáforo con color
  // (ámbar/verde/azul/rojo) usan tintes claros que ya contrastan y no se tocan.
  neutro: { badge: "border border-hairline bg-white text-black", dot: "" },
  gris: { badge: "border border-hairline bg-white text-black/70", dot: "bg-black/30" },
  ambar: { badge: "bg-amber-50 text-amber-700", dot: "bg-amber-500" },
  verde: { badge: "bg-emerald-50 text-emerald-700", dot: "bg-emerald-500" },
  azul: { badge: "bg-slate-100 text-slate-700", dot: "bg-slate-600" },
  rojo: { badge: "bg-red-50 text-red-700", dot: "bg-red-500" },
};

export default function EstadoPill({
  estado,
  colorize = false,
}: {
  estado: string | null;
  colorize?: boolean;
}) {
  const texto = (estado ?? "").trim() || "—";
  const tono: Tono = colorize ? ESTADO_TONO[texto] ?? "neutro" : "neutro";
  const clases = TONO_CLASES[tono];

  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-pill px-2.5 py-1 text-xs font-medium ${clases.badge}`}
    >
      {clases.dot && (
        <span className={`h-1.5 w-1.5 rounded-pill ${clases.dot}`} aria-hidden />
      )}
      {texto}
    </span>
  );
}
