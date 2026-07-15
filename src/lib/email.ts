import { Resend } from "resend";
import {
  esc,
  emailLayout,
  emailBoton,
  panelResumen,
  filaResumen,
} from "./emailLayout";
import { TELEFONO } from "./config";

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
  const saludo = nombre ? `Hola ${nombre},` : "Hola,";
  const url = params.url;

  const cuerpo = `<p style="margin:0 0 16px;font-size:16px;line-height:1.6;color:#000000;">${saludo}</p>
<p style="margin:0 0 24px;font-size:15px;line-height:1.7;color:rgba(0,0,0,0.80);">${esc(intro)}</p>
${emailBoton(url, "Pagar de forma segura")}
<p style="margin:22px 0 0;font-size:13px;line-height:1.6;color:rgba(0,0,0,0.60);">Si el botón no funciona, copia y pega este enlace en tu navegador:</p>
<p style="margin:6px 0 0;font-size:13px;line-height:1.5;word-break:break-all;"><a href="${url}" style="color:#000000;">${url}</a></p>
<p style="margin:24px 0 0;font-size:13px;line-height:1.6;color:rgba(0,0,0,0.60);">El pago se procesa de forma segura a través de Stripe.</p>`;

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
  duracionTexto: string | null; // "unas X horas"; null si no se conoce
  precioTexto: string; // precio final, IVA incluido, ya formateado
  servicios: string[]; // servicios incluidos (según interruptores del presupuesto)
  numObjetos: number; // total de objetos del inventario del cliente
  productos: ResumenProducto[]; // productos vendidos (cajas, material de embalaje)
};

export async function enviarEmailResumen(params: {
  para: string;
  nombre: string;
  datos: ResumenDatos;
}): Promise<EnvioResultado> {
  const nombre = esc(params.nombre);
  const saludo = nombre ? `Hola ${nombre},` : "Hola,";
  const d = params.datos;

  const filas =
    filaResumen("Origen", d.origen) +
    filaResumen("Destino", d.destino) +
    (d.fechaTexto ? filaResumen("Fecha de la mudanza", d.fechaTexto) : "") +
    filaResumen("Volumen estimado", d.volumenTexto) +
    (d.duracionTexto ? filaResumen("Duración estimada", d.duracionTexto) : "");

  // Servicios incluidos (una línea sobria, como el resto del panel).
  let serviciosHtml = "";
  if (d.servicios.length > 0) {
    const lista = d.servicios.map((s) => esc(s)).join(" · ");
    serviciosHtml = `<p style="margin:18px 0 0;font-size:12px;text-transform:uppercase;letter-spacing:0.04em;color:rgba(0,0,0,0.45);">Servicios incluidos</p>
<p style="margin:5px 0 0;font-size:14px;line-height:1.7;color:#000000;">${lista}</p>`;
  }

  // Inventario resumido: total de objetos + material de embalaje (sin listar
  // objeto por objeto). Dos apartados diferenciados: lo que se mueve de casa
  // del cliente (objetos) y lo que Mudanzas X le vende (productos).
  let objetosHtml = "";
  if (d.numObjetos > 0) {
    const txt = `${d.numObjetos} ${d.numObjetos === 1 ? "objeto" : "objetos"}`;
    objetosHtml = `<p style="margin:18px 0 0;font-size:12px;text-transform:uppercase;letter-spacing:0.04em;color:rgba(0,0,0,0.45);">Objetos de la mudanza</p>
<p style="margin:5px 0 0;font-size:14px;line-height:1.7;color:#000000;">${esc(txt)}</p>`;
  }

  let productosHtml = "";
  if (d.productos.length > 0) {
    const lista = d.productos
      .slice(0, 8)
      .map((p) => `${p.cantidad}× ${esc(p.nombre)}`)
      .join(" · ");
    const extra =
      d.productos.length > 8 ? ` · +${d.productos.length - 8} más` : "";
    productosHtml = `<p style="margin:18px 0 0;font-size:12px;text-transform:uppercase;letter-spacing:0.04em;color:rgba(0,0,0,0.45);">Productos</p>
<p style="margin:5px 0 0;font-size:14px;line-height:1.7;color:#000000;">${lista}${extra}</p>`;
  }

  const cuerpo = `<p style="margin:0 0 16px;font-size:16px;line-height:1.6;color:#000000;">${saludo}</p>
<p style="margin:0 0 22px;font-size:15px;line-height:1.7;color:rgba(0,0,0,0.80);">Aquí tienes el resumen de tu mudanza con Mudanzas X.</p>
${panelResumen(filas)}
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:18px 0 0;">
<tr>
<td style="font-size:14px;color:#000000;vertical-align:bottom;">Precio final <span style="color:rgba(0,0,0,0.45);font-size:12px;">(IVA incluido)</span></td>
<td style="text-align:right;font-size:22px;font-weight:700;color:#000000;">${esc(
    d.precioTexto
  )}</td>
</tr>
</table>
${serviciosHtml}
${objetosHtml}
${productosHtml}
<p style="margin:24px 0 22px;font-size:15px;line-height:1.7;color:rgba(0,0,0,0.80);">¿Quieres reservar tu fecha o tienes alguna duda? Estamos a una llamada.</p>
${emailBoton(`tel:${TELEFONO}`, "Llamar")}`;

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
  const saludo = nombre ? `Hola ${nombre},` : "Hola,";

  const cuerpo = `<p style="margin:0 0 16px;font-size:16px;line-height:1.6;color:#000000;">${saludo}</p>
<p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:rgba(0,0,0,0.80);">Gracias por confiar en Mudanzas X para tu mudanza. Esperamos que todo haya salido según lo previsto.</p>
<p style="margin:0 0 24px;font-size:15px;line-height:1.7;color:rgba(0,0,0,0.80);">Si has quedado conforme, puedes dejarnos tu valoración. Nos ayuda a mejorar y orienta a otras personas.</p>
${emailBoton(REVIEW_URL, "Dejar mi valoración")}
<p style="margin:24px 0 0;font-size:13px;line-height:1.6;color:rgba(0,0,0,0.60);">Gracias de antemano. Un saludo del equipo de Mudanzas X.</p>`;

  const html = emailLayout({
    titulo: "Tu valoración · Mudanzas X",
    preheader: "Cuéntanos cómo ha ido tu mudanza con Mudanzas X.",
    cuerpo,
  });
  return enviar({
    para: params.para,
    asunto: "Tu valoración · Mudanzas X",
    html,
  });
}

// ============================================================================
// 4) AVISO INTERNO AL NEGOCIO DE UN NUEVO LEAD (email a la empresa)
// ============================================================================

// Destinatario de los avisos de leads nuevos. Cámbialo aquí (o añade más
// direcciones separadas por comas) si en el futuro los recibe otra persona.
export const EMAIL_AVISOS = "info@mudanzasx.com";

// Email interno de aviso: directo y sin copy comercial. Lo importante es poder
// actuar desde la notificación del móvil: el teléfono va como enlace tel: y bien
// visible (acción principal), y un botón lleva a la ficha del lead en el panel.
export async function enviarEmailAvisoLead(params: {
  nombre: string;
  telefono: string; // tal cual llega del formulario (p. ej. "+34 612 34 56 78")
  email: string; // "" si el cliente no lo dejó
  origen: string;
  destino: string;
  fichaUrl: string; // URL absoluta a la ficha (o a la lista si no se conoce el id)
  fechaHoraTexto: string;
}): Promise<EnvioResultado> {
  const nombre = esc(params.nombre);
  const telefono = esc(params.telefono);
  const telHref = params.telefono.replace(/\s+/g, ""); // tel: sin espacios

  const filas =
    (params.email ? filaResumen("Email", params.email) : "") +
    filaResumen("Origen", params.origen) +
    filaResumen("Destino", params.destino) +
    filaResumen("Entrada", params.fechaHoraTexto);

  const cuerpo = `<p style="margin:0 0 6px;font-size:12px;text-transform:uppercase;letter-spacing:0.04em;color:rgba(0,0,0,0.45);">Nuevo lead desde la web</p>
<p style="margin:0 0 2px;font-size:22px;line-height:1.25;font-weight:700;color:#000000;">${nombre}</p>
<p style="margin:0 0 22px;font-size:20px;line-height:1.3;font-weight:700;">
<a href="tel:${telHref}" style="color:#000000;text-decoration:none;">${telefono}</a>
</p>
${panelResumen(filas)}
<div style="margin:22px 0 0;">${emailBoton(params.fichaUrl, "Abrir ficha en el panel")}</div>`;

  const html = emailLayout({
    titulo: "Nuevo lead · Mudanzas X",
    preheader: `${params.origen} → ${params.destino}`,
    cuerpo,
  });
  // Asunto escaneable desde el móvil: nombre y teléfono delante (texto plano).
  return enviar({
    para: EMAIL_AVISOS,
    asunto: `Nuevo lead: ${params.nombre} · ${params.telefono}`,
    html,
  });
}
