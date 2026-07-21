// Rótulos canónicos de los servicios de "Mudanza de vivienda". FUENTE ÚNICA:
// la usan la sección pública (components/Servicios.tsx) y el email de resumen al
// cliente (admin/.../emailActions.ts) para que los nombres NO se desincronicen.
// Si cambian aquí, cambian en los dos sitios a la vez.
export const SERVICIO_LABEL = {
  montaje: "Montaje, desmontaje y protección",
  transporte: "Transporte, carga y descarga",
  permisos: "Gestión de permisos municipales",
  retirada: "Retirada a punto limpio",
} as const;
