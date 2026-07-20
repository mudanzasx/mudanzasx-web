// Clase compartida de campo de formulario (input/select/textarea), sobre los
// tokens de la Fase 4. Sustituye las copias de `fieldClass` repartidas por el
// proyecto. Se puede componer con `className` (p. ej. `appearance-none`,
// `resize-y` o un margen superior).
//
// variant: admin (gris sobre superficies blancas del panel) / public (blanco
// sobre la sección gris pública). size: sm / md / lg.

type Variant = "admin" | "public";
type Size = "sm" | "md" | "lg";

const VARIANTS: Record<Variant, string> = {
  // Panel: relleno gris suave + hairline definida, para que el campo se
  // distinga con claridad sobre la tarjeta blanca (dónde se escribe).
  admin: "bg-gris border-hairline",
  public: "bg-white border-hairline",
};

// Mismo criterio tipográfico que button.ts: tamaño fluido (tokens con clamp),
// con el MÁXIMO igual al fijo previo, así el escritorio se ve idéntico y solo se
// reduce en pantallas estrechas. sm/md → `text-small` (14px máx, como en button);
// lg → `text-body`, cuyo mínimo es 14px, para no bajar del cuerpo legible en el
// campo público (QuoteForm), que es donde el usuario teclea (16px en escritorio).
const SIZES: Record<Size, string> = {
  sm: "px-3 py-2 text-small",
  md: "px-3 py-2.5 text-small",
  lg: "px-4 py-3 text-body",
};

export function field(
  opts: { variant?: Variant; size?: Size; className?: string } = {}
): string {
  const { variant = "admin", size = "md", className } = opts;
  return [
    "w-full rounded-field text-black placeholder-black/40 outline-none border transition-colors duration-150 focus:border-black",
    VARIANTS[variant],
    SIZES[size],
    className,
  ]
    .filter(Boolean)
    .join(" ");
}
