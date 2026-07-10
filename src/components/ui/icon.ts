import type { SVGProps } from "react";

// Props comunes a los iconos SVG propios del proyecto (BrandIcons: logos de
// redes sociales). Los iconos de interfaz usan lucide-react con trazo 1.5
// uniforme (peso de línea fino y sobrio de la marca).
export type IconProps = SVGProps<SVGSVGElement> & { size?: number };
