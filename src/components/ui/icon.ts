import type { SVGProps } from "react";

// Props comunes de los iconos SVG propios del proyecto (BrandIcons: redes
// sociales). Los de interfaz usan lucide-react.
export type IconProps = SVGProps<SVGSVGElement> & { size?: number };
