// Datos de contacto y constantes fáciles de cambiar en un único sitio.
// TELEFONO: valor para los enlaces tel: (sin espacios).
export const TELEFONO = "+34936942941";

// Versión legible para mostrar al usuario (texto visible).
export const TELEFONO_TEXTO = "+34 936 942 941";

// Etiqueta del botón de llamada de la cabecera.
export const TELEFONO_DISPLAY = "Llamar";

// Datos identificativos del titular. Se usan literalmente en las páginas legales
// (aviso legal, privacidad y cookies). Un único sitio para actualizarlos.
export const EMPRESA = {
  titular: "Youssef Lahrech El Mekaddem",
  formaJuridica: "Empresario individual (autónomo)",
  nif: "49806443N",
  domicilio: "Calle Unió, 15, 08420 Canovelles, Barcelona (España)",
  email: "info@mudanzasx.com",
  web: "www.mudanzasx.com",
  actividad: "Servicio de mudanzas",
  iae: "757.1",
} as const;

// Fecha de última actualización de los textos legales. Actualízala cuando cambien.
export const LEGAL_ACTUALIZADO = "1 de julio de 2026";
