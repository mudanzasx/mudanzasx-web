// Familia propia de iconos monolínea del proyecto (activo de marca, sin
// librerías externas). Sistema unificado:
//   · viewBox 24x24 en todos · trazo 1.5 · sin relleno (fill="none")
//   · stroke-linecap/linejoin "round" · color heredado con currentColor
//   · geometría sobre rejilla de 24 con padding óptico (~2-4px, sin tocar el
//     borde) y densidad de detalle homogénea.
// El trazo escala con `size` (no usamos vector-effect="non-scaling-stroke"): los
// iconos se usan a tamaños distintos (13px en el badge del formulario, 26px en
// las tarjetas de Servicios) y un trazo proporcional mantiene el mismo peso
// visual relativo en todos; un trazo no escalable se vería pesado en pequeño.
// Solo se conservan los iconos realmente en uso; el resto se retiró como código
// muerto. Los iconos de redes sociales viven aparte en BrandIcons.tsx.
import type { ReactNode } from "react";
import type { IconProps } from "@/components/ui/icon";

function Icon({
  size = 24,
  children,
  ...props
}: IconProps & { children: ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      {...props}
    >
      {children}
    </svg>
  );
}

// Permisos municipales · edificio institucional (pórtico de columnas).
export function IconBuilding(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M4 10 12 5l8 5" />
      <path d="M4 20h16" />
      <path d="M6.5 10v10" />
      <path d="M12 10v10" />
      <path d="M17.5 10v10" />
    </Icon>
  );
}

// Montaje y desmontaje · llave inglesa.
export function IconTools(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
    </Icon>
  );
}

// Transporte, carga y descarga · camión.
export function IconTruck(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M2 6h11v10H2z" />
      <path d="M13 9h4l4 4v3h-8z" />
      <circle cx="6.5" cy="17.5" r="1.6" />
      <circle cx="17.5" cy="17.5" r="1.6" />
    </Icon>
  );
}

// Retirada a punto limpio · reciclaje. Tres flechas curvas idénticas dispuestas
// por rotación de 120° (simetría exacta). Cada brazo es una curva cuadrática
// (determinista, sin la ambigüedad de dirección de un arco) con su punta.
export function IconRecycle(props: IconProps) {
  const brazo = (
    <>
      <path d="M6.96 13.5 Q8.2 8.8 11.68 6" />
      <path d="M9.5 6.2 11.68 6 11 8.1" />
    </>
  );
  return (
    <Icon {...props}>
      <g>{brazo}</g>
      <g transform="rotate(120 12 12)">{brazo}</g>
      <g transform="rotate(240 12 12)">{brazo}</g>
    </Icon>
  );
}

// Operativa 24/7 · reloj (usado también en el badge "10 min" del formulario).
export function IconClock(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 8v4l3 2" />
    </Icon>
  );
}
