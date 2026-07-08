// Primitivo de botón de marca: devuelve la cadena de clases para un botón tipo
// píldora coherente. Es solo estilo (no envuelve lógica), así se puede aplicar
// tanto a <button> como a <Link>/<a> con className, sin tocar sus props.
//
// Variantes:
//   primary   → píldora negra (CTA principal).
//   secondary → contorno hairline, hover con tinte de negro (funciona sobre
//               fondo blanco y gris por igual).
// Tamaños: sm / md / lg (paddings consistentes; antes había 5 variantes sueltas).

type Variant = "primary" | "secondary";
type Size = "sm" | "md" | "lg";

const BASE =
  "inline-flex items-center justify-center gap-2 rounded-pill font-medium transition-colors duration-150 disabled:opacity-40 disabled:cursor-not-allowed";

const VARIANTS: Record<Variant, string> = {
  primary: "bg-black text-white hover:bg-black/85",
  secondary: "border border-hairline bg-transparent hover:bg-black/5",
};

const SIZES: Record<Size, string> = {
  sm: "px-4 py-2 text-sm",
  md: "px-5 py-2.5 text-sm",
  lg: "px-8 py-4 text-base",
};

export function btn(
  opts: { variant?: Variant; size?: Size; className?: string } = {}
): string {
  const { variant = "primary", size = "md", className } = opts;
  return [BASE, VARIANTS[variant], SIZES[size], className]
    .filter(Boolean)
    .join(" ");
}
