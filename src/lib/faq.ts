// Preguntas frecuentes (fuente única). Vive en un módulo de datos (no "use
// client") para poder consumirse tanto desde el componente cliente Faq.tsx como
// desde el Server Component page.tsx (JSON-LD FAQPage), sin cruzar el límite RSC.
export const PREGUNTAS = [
  {
    q: "¿Desde dónde y hasta dónde hacéis mudanzas?",
    a: "Desde Barcelona a cualquier punto de la península, y de cualquier punto de la península a Barcelona. Uno de los dos extremos siempre es Barcelona.",
  },
  {
    q: "¿Cómo se calcula el precio?",
    a: "Con datos reales: volumen de lo que mueves, distancia entre origen y destino, número de operarios y horas. No trabajamos con estimaciones a ojo.",
  },
  {
    q: "¿Qué necesito pagar para reservar?",
    a: "Primero cerramos tu presupuesto. Para reservar la fecha, pagas el 50% (o el 100% con un 5% de descuento). El resto se abona el día de la mudanza.",
  },
  {
    q: "¿Trabajáis fines de semana o festivos?",
    a: "La operativa funciona 24 horas, 365 días al año. La atención comercial es de lunes a viernes de 9:00 a 21:00 y sábados de 9:00 a 17:00.",
  },
  {
    q: "¿Cuánto tardáis en darme el presupuesto?",
    a: "Te contactamos el mismo día laborable para conocer los detalles y cerrar tu presupuesto.",
  },
  {
    q: "¿Puedo comprar cajas y material de embalaje?",
    a: "Sí: cajas de cartón, cajas armario y bolsas de mudanza. Se incluye en el presupuesto si lo necesitas.",
  },
];
