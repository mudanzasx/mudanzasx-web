// Validaciones compartidas de contacto (teléfono y email), usadas tanto por el
// formulario público como por el alta manual del panel, y también en el servidor
// (API de leads y Server Action) como segunda barrera.

// Normaliza un teléfono español para validarlo: quita espacios/separadores y el
// prefijo internacional (+34 / 0034), dejando solo los 9 dígitos si los hay.
export function normalizarTelefonoEs(valor: string): string {
  let s = (valor ?? "").replace(/[\s.\-()]/g, "");
  if (s.startsWith("+34")) s = s.slice(3);
  else if (s.startsWith("0034")) s = s.slice(4);
  return s;
}

// Teléfono español válido: 9 dígitos empezando por 6, 7, 8 o 9.
export function esTelefonoEsValido(valor: string): boolean {
  return /^[6-9]\d{8}$/.test(normalizarTelefonoEs(valor));
}

// Formato de email razonable y estándar (algo@dominio.ext). Coincide con la
// validación del servidor para no dar falsos positivos entre cliente y API.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export function esEmailValido(valor: string): boolean {
  return EMAIL_RE.test((valor ?? "").trim());
}

// Mensajes de aviso (sobrios) reutilizados por los formularios.
export const AVISO_TELEFONO = "Introduce un teléfono válido de 9 dígitos.";
export const AVISO_EMAIL = "Introduce un correo válido.";
