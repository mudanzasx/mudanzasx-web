// Familia propia de iconos monolínea (trazo 2px sobre rejilla 24, geométricos).
// Coherentes entre "Cómo funciona", "Servicios" y la banda de confianza.
import type { ReactNode } from "react";
import type { IconProps } from "@/components/ui/icon";

function Icon({
  size = 28,
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
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      {...props}
    >
      {children}
    </svg>
  );
}

// Paso 1 · ruta / ubicación
export function IconRoute(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M12 21s7-6.5 7-12a7 7 0 1 0-14 0c0 5.5 7 12 7 12z" />
      <circle cx="12" cy="9" r="2.5" />
    </Icon>
  );
}

// Paso 2 · datos / cálculo
export function IconData(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M3 21h18" />
      <path d="M6 21V13" />
      <path d="M12 21V7" />
      <path d="M18 21v-5" />
    </Icon>
  );
}

// Paso 3 · candado / reserva
export function IconLock(props: IconProps) {
  return (
    <Icon {...props}>
      <rect x="5" y="11" width="14" height="9" rx="2" />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" />
      <path d="M12 15v2" />
    </Icon>
  );
}

// Paso 4 · camión / ejecución · transporte
export function IconTruck(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M1 6h12v10H1z" />
      <path d="M13 10h3.5l3 3v3H13z" />
      <circle cx="5.5" cy="18" r="2" />
      <circle cx="17" cy="18" r="2" />
    </Icon>
  );
}

// Presupuesto · documento
export function IconDocument(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M6 2h8l4 4v16H6z" />
      <path d="M14 2v4h4" />
      <path d="M9 12h6" />
      <path d="M9 16h6" />
      <path d="M9 20h3" />
    </Icon>
  );
}

// Planificación · calendario
export function IconCalendar(props: IconProps) {
  return (
    <Icon {...props}>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M3 9h18" />
      <path d="M8 3v4" />
      <path d="M16 3v4" />
    </Icon>
  );
}

// Permisos municipales · edificio institucional
export function IconBuilding(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M3 9 12 4l9 5" />
      <path d="M2 21h20" />
      <path d="M4 9v12" />
      <path d="M20 9v12" />
      <path d="M8 12v6" />
      <path d="M12 12v6" />
      <path d="M16 12v6" />
    </Icon>
  );
}

// Montaje y desmontaje · llave inglesa
export function IconTools(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
    </Icon>
  );
}

// Protección y embalaje · caja / paquete
export function IconBox(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M12 2 20 6v10l-8 4-8-4V6z" />
      <path d="M4 6l8 4 8-4" />
      <path d="M12 10v10" />
    </Icon>
  );
}

// Carga y descarga · caja con flecha
export function IconLoad(props: IconProps) {
  return (
    <Icon {...props}>
      <rect x="6" y="12" width="12" height="9" rx="1" />
      <path d="M12 9V3" />
      <path d="M9 6l3-3 3 3" />
    </Icon>
  );
}

// Retirada a punto limpio · reciclaje
export function IconRecycle(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M7 19H4.815a1.83 1.83 0 0 1-1.57-.881 1.785 1.785 0 0 1-.004-1.784L7.196 9.5" />
      <path d="M11 19h8.203a1.83 1.83 0 0 0 1.556-.89 1.784 1.784 0 0 0 0-1.775l-1.226-2.12" />
      <path d="m14 16-3 3 3 3" />
      <path d="M8.293 13.596 7.196 9.5 3.1 10.598" />
      <path d="m9.344 5.811 1.093-1.892A1.83 1.83 0 0 1 11.985 3a1.784 1.784 0 0 1 1.546.888l3.943 6.843" />
      <path d="m13.378 9.633 4.096 1.098 1.097-4.096" />
    </Icon>
  );
}

// Cobertura nacional · mapa
export function IconMap(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M3 6l6-2 6 2 6-2v14l-6 2-6-2-6 2z" />
      <path d="M9 4v14" />
      <path d="M15 6v14" />
    </Icon>
  );
}

// Operativa 24/7 · reloj
export function IconClock(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3.5 2.5" />
    </Icon>
  );
}

// Seguro de responsabilidad civil · escudo
export function IconShield(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M12 2 20 5v6c0 5-3.5 8.5-8 10-4.5-1.5-8-5-8-10V5z" />
    </Icon>
  );
}

// Mercancías aseguradas · escudo con check
export function IconShieldCheck(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M12 2 20 5v6c0 5-3.5 8.5-8 10-4.5-1.5-8-5-8-10V5z" />
      <path d="M8.5 12l2.5 2.5 4.5-5" />
    </Icon>
  );
}

// Confirmación · check en círculo
export function IconCheckCircle(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M8 12l3 3 5-6" />
    </Icon>
  );
}
