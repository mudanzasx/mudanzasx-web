import { EMPRESA, TELEFONO, TELEFONO_TEXTO } from "./config";

// URL absoluta del sitio en producción. En emails las rutas deben ser absolutas
// (los clientes de correo no resuelven rutas relativas) y el logo debe ser PNG
// (los clientes de correo no renderizan SVG).
export const SITE_URL = "https://www.mudanzasx.com";

// Escapa texto para incrustarlo con seguridad en el HTML del email.
export function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// Botón de acción estándar (negro, redondeado). Mismo estilo en todos los emails.
export function emailBoton(url: string, label: string): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0"><tr>
<td style="border-radius:999px;background:#000000;">
<a href="${url}" target="_blank" style="display:inline-block;padding:14px 30px;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:999px;">${esc(label)}</a>
</td></tr></table>`;
}

// Fila de un panel/resumen sobrio (etiqueta a la izquierda, valor a la derecha).
export function filaResumen(label: string, valor: string): string {
  return `<tr>
<td style="padding:10px 0;border-bottom:1px solid rgba(0,0,0,0.10);font-size:13px;color:rgba(0,0,0,0.45);vertical-align:top;">${esc(label)}</td>
<td style="padding:10px 0;border-bottom:1px solid rgba(0,0,0,0.10);font-size:14px;color:#000000;font-weight:600;text-align:right;vertical-align:top;">${esc(valor)}</td>
</tr>`;
}

// Envuelve varias filasResumen en un panel con fondo gris claro.
export function panelResumen(filas: string): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F3F3F3;border-radius:10px;">
<tr><td style="padding:6px 18px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0">${filas}</table>
</td></tr></table>`;
}

// Layout común de email: cabecera negra con logo blanco, cuerpo central y pie con
// contacto (teléfono, email y política de privacidad). Todos los emails de la app
// usan este layout para ser simétricos y coherentes.
export function emailLayout(params: {
  titulo?: string;
  preheader?: string;
  cuerpo: string;
}): string {
  const titulo = esc(params.titulo ?? "Mudanzas X");
  // Preheader oculto: texto de vista previa en la bandeja de entrada.
  const preheader = params.preheader
    ? `<div style="display:none;max-height:0;overflow:hidden;mso-hide:all;opacity:0;color:transparent;">${esc(
        params.preheader
      )}</div>`
    : "";

  return `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${titulo}</title>
</head>
<body style="margin:0;padding:0;background:#f3f3f3;">
${preheader}
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f3f3f3;font-family:'Montserrat',Arial,Helvetica,sans-serif;">
<tr><td align="center" style="padding:24px 12px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border-radius:12px;">
<tr><td align="center" bgcolor="#000000" style="background-color:#000000;padding:24px 32px;border-radius:12px 12px 0 0;">
<img src="${SITE_URL}/logo-white-email.png" width="200" alt="Mudanzas X" style="display:block;width:200px;max-width:70%;height:auto;border:0;outline:none;text-decoration:none;">
</td></tr>
<tr><td style="padding:28px 32px 0;">
${params.cuerpo}
</td></tr>
<tr><td style="padding:26px 32px 30px;">
<div style="border-top:1px solid rgba(0,0,0,0.10);margin:0 0 16px;"></div>
<p style="margin:0;font-size:12px;line-height:1.7;color:rgba(0,0,0,0.45);">
<a href="tel:${TELEFONO}" style="color:rgba(0,0,0,0.45);text-decoration:none;">${TELEFONO_TEXTO}</a> · <a href="mailto:${EMPRESA.email}" style="color:rgba(0,0,0,0.45);">${EMPRESA.email}</a>
</p>
<p style="margin:6px 0 0;font-size:12px;line-height:1.7;color:rgba(0,0,0,0.35);">
<a href="${SITE_URL}/privacidad" style="color:rgba(0,0,0,0.35);">Política de privacidad</a>
</p>
</td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;
}
