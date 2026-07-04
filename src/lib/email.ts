import { Resend } from "resend";
import {
  SITE_URL,
  esc,
  emailLayout,
  emailBoton,
  panelResumen,
  filaResumen,
} from "./emailLayout";

// Remitente del correo. El dominio mudanzasx.com está verificado en Resend.
export const EMAIL_FROM = "Mudanzas X <info@mudanzasx.com>";

// Enlace de reseña de Google (perfil de empresa).
const REVIEW_URL = "https://g.page/r/CVNn17TrIUM4EBI/review";

let cliente: Resend | null = null;
function getResend(): Resend {
  const key = process.env.RESEND_API_KEY;
  if (!key) throw new Error("Falta RESEND_API_KEY en el entorno.");
  if (!cliente) cliente = new Resend(key);
  return cliente;
}

export type EnvioResultado = { ok: true } | { ok: false; error: string };

// Envío común: centraliza el manejo de errores para que el operario reciba
// siempre un mensaje claro y nunca se propague una excepción a la página.
async function enviar(params: {
  para: string;
  asunto: string;
  html: string;
}): Promise<EnvioResultado> {
  try {
    const resend = getResend();
    const { error } = await resend.emails.send({
      from: EMAIL_FROM,
      to: params.para,
      subject: params.asunto,
      html: params.html,
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

// ============================================================================
// 1) EMAIL DE ENLACE DE PAGO
// ============================================================================

export type TipoCobroEmail = "reserva50" | "total" | "resto";

// Asunto e introducción según el tipo de cobro.
function contenidoPago(
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

// Envía el email con el enlace de pago. Devuelve un resultado manejable (no
// lanza) para que el operario vea un mensaje claro.
export async function enviarEmailPago(params: {
  para: string;
  nombre: string;
  tipo: TipoCobroEmail;
  importeTexto: string;
  url: string;
}): Promise<EnvioResultado> {
  const { asunto, intro } = contenidoPago(params.tipo, params.importeTexto);
  const nombre = esc(params.nombre);
  const url = params.url;

  const cuerpo = `<p style="margin:0 0 16px;font-size:16px;line-height:1.6;color:#000000;">Hola ${nombre},</p>
<p style="margin:0 0 24px;font-size:15px;line-height:1.7;color:#333333;">${esc(intro)}</p>
${emailBoton(url, "Pagar de forma segura")}
<p style="margin:22px 0 0;font-size:13px;line-height:1.6;color:#666666;">Si el botón no funciona, copia y pega este enlace en tu navegador:</p>
<p style="margin:6px 0 0;font-size:13px;line-height:1.5;word-break:break-all;"><a href="${url}" style="color:#000000;">${url}</a></p>
<p style="margin:24px 0 0;font-size:13px;line-height:1.6;color:#666666;">El pago se procesa de forma segura a través de Stripe.</p>`;

  const html = emailLayout({ titulo: "Mudanzas X", preheader: intro, cuerpo });
  return enviar({ para: params.para, asunto, html });
}

// ============================================================================
// 2) EMAIL DE RESUMEN DEL SERVICIO / PRESUPUESTO
// ============================================================================

export type ResumenProducto = { nombre: string; cantidad: number };

export type ResumenDatos = {
  origen: string;
  destino: string;
  fechaTexto: string | null; // ya formateada; null si el presupuesto no tiene fecha
  volumenTexto: string;
  vehiculo: string;
  precioTexto: string; // precio final, IVA incluido, ya formateado
  productos: ResumenProducto[];
};

export async function enviarEmailResumen(params: {
  para: string;
  nombre: string;
  datos: ResumenDatos;
}): Promise<EnvioResultado> {
  const nombre = esc(params.nombre);
  const d = params.datos;

  const filas =
    filaResumen("Origen", d.origen) +
    filaResumen("Destino", d.destino) +
    (d.fechaTexto ? filaResumen("Fecha de la mudanza", d.fechaTexto) : "") +
    filaResumen("Volumen estimado", d.volumenTexto) +
    filaResumen("Vehículo", d.vehiculo);

  // Productos/servicios destacables (máx. 6 para mantener el email limpio).
  let productosHtml = "";
  if (d.productos.length > 0) {
    const lista = d.productos
      .slice(0, 6)
      .map((p) => `${p.cantidad}× ${esc(p.nombre)}`)
      .join(" · ");
    const extra =
      d.productos.length > 6 ? ` · +${d.productos.length - 6} más` : "";
    productosHtml = `<p style="margin:18px 0 0;font-size:12px;text-transform:uppercase;letter-spacing:0.04em;color:#888888;">Incluye</p>
<p style="margin:5px 0 0;font-size:14px;line-height:1.7;color:#000000;">${lista}${extra}</p>`;
  }

  const cuerpo = `<p style="margin:0 0 16px;font-size:16px;line-height:1.6;color:#000000;">Hola ${nombre},</p>
<p style="margin:0 0 22px;font-size:15px;line-height:1.7;color:#333333;">Aquí tienes el resumen de tu mudanza con Mudanzas X.</p>
${panelResumen(filas)}
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:18px 0 0;">
<tr>
<td style="font-size:14px;color:#000000;vertical-align:bottom;">Precio final <span style="color:#888888;font-size:12px;">(IVA incluido)</span></td>
<td style="text-align:right;font-size:22px;font-weight:700;color:#000000;">${esc(
    d.precioTexto
  )}</td>
</tr>
</table>
${productosHtml}
<p style="margin:24px 0 0;font-size:13px;line-height:1.7;color:#666666;">Para confirmar la reserva, se abona el 50% del importe (o el 100% con un 5% de descuento); el resto se paga el día de la mudanza.</p>
<p style="margin:16px 0 22px;font-size:15px;line-height:1.7;color:#333333;">¿Quieres reservar tu fecha? Responde a este correo o llámanos y lo dejamos todo listo.</p>
${emailBoton(SITE_URL, "Visitar mudanzasx.com")}`;

  const html = emailLayout({
    titulo: "Resumen de tu mudanza · Mudanzas X",
    preheader: "Resumen de tu mudanza con Mudanzas X.",
    cuerpo,
  });
  return enviar({
    para: params.para,
    asunto: "Resumen de tu mudanza · Mudanzas X",
    html,
  });
}

// ============================================================================
// 3) EMAIL DE PETICIÓN DE VALORACIÓN
// ============================================================================

export async function enviarEmailValoracion(params: {
  para: string;
  nombre: string;
}): Promise<EnvioResultado> {
  const nombre = esc(params.nombre);

  const cuerpo = `<p style="margin:0 0 16px;font-size:16px;line-height:1.6;color:#000000;">Hola ${nombre},</p>
<p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#333333;">Gracias por confiar en Mudanzas X para tu mudanza. Esperamos que todo haya ido a las mil maravillas.</p>
<p style="margin:0 0 24px;font-size:15px;line-height:1.7;color:#333333;">Nos encantaría saber cómo ha sido tu experiencia. Si nos dejas tu valoración, nos ayudas a mejorar y orientas a otras personas que buscan una mudanza de confianza. Solo te llevará un minuto.</p>
${emailBoton(REVIEW_URL, "Dejar mi valoración")}
<p style="margin:24px 0 0;font-size:13px;line-height:1.6;color:#666666;">Gracias de antemano. Un saludo del equipo de Mudanzas X.</p>`;

  const html = emailLayout({
    titulo: "¿Qué te ha parecido? · Mudanzas X",
    preheader: "Cuéntanos cómo ha ido tu mudanza con Mudanzas X.",
    cuerpo,
  });
  return enviar({
    para: params.para,
    asunto: "¿Qué te ha parecido tu mudanza? · Mudanzas X",
    html,
  });
}
