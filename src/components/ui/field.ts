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
  admin: "bg-gris border-transparent",
  public: "bg-white border-hairline",
};

const SIZES: Record<Size, string> = {
  sm: "px-3 py-2 text-sm",
  md: "px-3 py-2.5 text-sm",
  lg: "px-4 py-3 text-base",
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
