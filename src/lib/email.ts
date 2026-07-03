import { Resend } from "resend";
import { EMPRESA, TELEFONO, TELEFONO_TEXTO } from "./config";

// Remitente del correo.
// TEMPORAL: usamos el remitente de pruebas de Resend porque el dominio propio
// (mudanzasx.com) aún no está verificado en Resend. Cuando lo esté, sustituir
// por "Mudanzas X <info@mudanzasx.com>".
export const EMAIL_FROM = "Mudanzas X <onboarding@resend.dev>";

// URL absoluta del sitio en producción. En emails las rutas deben ser absolutas
// (los clientes de correo no resuelven rutas relativas).
const SITE_URL = "https://www.mudanzasx.com";

let cliente: Resend | null = null;
function getResend(): Resend {
  const key = process.env.RESEND_API_KEY;
  if (!key) throw new Error("Falta RESEND_API_KEY en el entorno.");
  if (!cliente) cliente = new Resend(key);
  return cliente;
}

export type TipoCobroEmail = "reserva50" | "total" | "resto";

// Asunto e introducción según el tipo de cobro.
function contenido(
  tipo: TipoCobroEmail,
  importeTexto: string
): { asunto: string; intro: string } {
  switch (tipo) {
    case "total":
      return {
        asunto: "Pago de tu mudanza · Mudanzas X",
        intro: `Puedes completar el pago total de tu mudanza (${importeTexto}, con el 5% de descuento ya aplicado) de forma segura desde el siguiente enlace.`,
      };
    case "resto":
      return {
        asunto: "Pago pendiente de tu mudanza · Mudanzas X",
        intro: `Ya solo queda el importe restante de tu mudanza (${importeTexto}). Puedes abonarlo de forma segura desde el siguiente enlace.`,
      };
    case "reserva50":
    default:
      return {
        asunto: "Reserva de tu mudanza · Mudanzas X",
        intro: `Para confirmar la fecha de tu mudanza, puedes abonar la reserva (${importeTexto}) de forma segura desde el siguiente enlace.`,
      };
  }
}

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// Plantilla HTML sobria y responsive (tablas + estilos inline por compatibilidad
// con clientes de correo). Blanco/negro/gris, tipografía web-safe de respaldo.
function plantillaHtml(params: {
  nombre: string;
  intro: string;
  url: string;
}): string {
  const nombre = esc(params.nombre);
  const intro = esc(params.intro);
  const url = params.url;
  return `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Mudanzas X</title>
</head>
<body style="margin:0;padding:0;background:#f3f3f3;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f3f3f3;font-family:'Montserrat',Arial,Helvetica,sans-serif;">
<tr><td align="center" style="padding:24px 12px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border-radius:12px;">
<tr><td align="center" bgcolor="#000000" style="background-color:#000000;padding:24px 32px;border-radius:12px 12px 0 0;">
<img src="${SITE_URL}/logo-white-email.png" width="200" alt="Mudanzas X" style="display:block;width:200px;max-width:70%;height:auto;border:0;outline:none;text-decoration:none;">
</td></tr>
<tr><td style="padding:28px 32px 0;">
<p style="margin:0 0 16px;font-size:16px;line-height:1.6;color:#000000;">Hola ${nombre},</p>
<p style="margin:0 0 24px;font-size:15px;line-height:1.7;color:#333333;">${intro}</p>
<table role="presentation" cellpadding="0" cellspacing="0"><tr>
<td style="border-radius:999px;background:#000000;">
<a href="${url}" target="_blank" style="display:inline-block;padding:14px 30px;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:999px;">Pagar de forma segura</a>
</td></tr></table>
<p style="margin:22px 0 0;font-size:13px;line-height:1.6;color:#666666;">Si el botón no funciona, copia y pega este enlace en tu navegador:</p>
<p style="margin:6px 0 0;font-size:13px;line-height:1.5;word-break:break-all;"><a href="${url}" style="color:#000000;">${url}</a></p>
<p style="margin:24px 0 0;font-size:13px;line-height:1.6;color:#666666;">El pago se procesa de forma segura a través de Stripe.</p>
</td></tr>
<tr><td style="padding:26px 32px 30px;">
<div style="border-top:1px solid #eeeeee;margin:0 0 16px;"></div>
<p style="margin:0;font-size:12px;line-height:1.7;color:#888888;">
<a href="tel:${TELEFONO}" style="color:#888888;text-decoration:none;">${TELEFONO_TEXTO}</a> · <a href="mailto:${EMPRESA.email}" style="color:#888888;">${EMPRESA.email}</a>
</p>
<p style="margin:6px 0 0;font-size:12px;line-height:1.7;color:#aaaaaa;">
<a href="${SITE_URL}/privacidad" style="color:#aaaaaa;">Política de privacidad</a>
</p>
</td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;
}

// Envía el email con el enlace de pago. Devuelve un resultado manejable (no
// lanza) para que el operario vea un mensaje claro.
export async function enviarEmailPago(params: {
  para: string;
  nombre: string;
  tipo: TipoCobroEmail;
  importeTexto: string;
  url: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const { asunto, intro } = contenido(params.tipo, params.importeTexto);
  const html = plantillaHtml({
    nombre: params.nombre,
    intro,
    url: params.url,
  });
  try {
    const resend = getResend();
    const { error } = await resend.emails.send({
      from: EMAIL_FROM,
      to: params.para,
      subject: asunto,
      html,
    });
    if (error) {
      console.error("[resend] Error enviando email:", error);
      return { ok: false, error: "No se pudo enviar el email al cliente." };
    }
    return { ok: true };
  } catch (e) {
    console.error("[resend] Excepción enviando email:", e);
    return { ok: false, error: "No se pudo enviar el email al cliente." };
  }
}
