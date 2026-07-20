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
  // gris se fundiría con el gris de la página). Los tonos con color usan los
  // tokens del semáforo (--color-status-*, ver globals.css): tintes claros que
  // ya contrastan y son la única excepción funcional a la paleta monocroma.
  neutro: { badge: "border border-hairline bg-white text-black", dot: "" },
  gris: { badge: "border border-hairline bg-white text-black/70", dot: "bg-black/30" },
  ambar: { badge: "bg-status-warning-surface text-status-warning-text", dot: "bg-status-warning-accent" },
  verde: { badge: "bg-status-success-surface text-status-success-text", dot: "bg-status-success-accent" },
  azul: { badge: "bg-status-info-surface text-status-info-text", dot: "bg-status-info-accent" },
  rojo: { badge: "bg-status-danger-surface text-status-danger-text", dot: "bg-status-danger-accent" },
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
