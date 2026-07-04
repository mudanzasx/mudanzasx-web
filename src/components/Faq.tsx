"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import SectionImage from "./SectionImage";

const PREGUNTAS = [
  {
    q: "¿Desde dónde y hasta dónde hacéis mudanzas?",
    a: "Desde Barcelona a cualquier punto de la península, y de cualquier punto de la península a Barcelona. Uno de los dos extremos siempre es Barcelona.",
  },
  {
    q: "¿Cómo se calcula el precio?",
    a: "Con datos reales: volumen de lo que mueves, distancia entre origen y destino, número de operarios y horas. No trabajamos con estimaciones a ojo.",
  },
  {
    q: "¿Cómo sé cuánto me costará?",
    a: "Nos dejas los datos de tu mudanza y te llamamos para conocer los detalles (volumen, planta, ascensor, acceso). Con eso cerramos un precio claro, sin sorpresas después.",
  },
  {
    q: "¿Qué necesito pagar para reservar?",
    a: "Primero cerramos tu presupuesto. Para reservar la fecha, pagas el 50% (o el 100% con un 5% de descuento). El resto se abona el día de la mudanza.",
  },
  {
    q: "¿Desmontáis y montáis los muebles?",
    a: "Sí: desmontaje, embalaje, carga, transporte, descarga y montaje. También gestionamos permisos de estacionamiento si hacen falta.",
  },
  {
    q: "¿Trabajáis fines de semana o festivos?",
    a: "La operativa funciona 24 horas, 365 días al año. La atención comercial es de lunes a viernes de 9:00 a 21:00 y sábados de 9:00 a 17:00.",
  },
  {
    q: "¿Estáis asegurados?",
    a: "Sí. Tenemos seguro de responsabilidad civil y seguro de las mercancías transportadas y manipuladas.",
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

export default function Faq() {
  const [abierta, setAbierta] = useState<number | null>(null);

  return (
    <section id="faq" className="w-full border-t border-black/10">
      <div className="mx-auto max-w-[1100px] px-6 py-14 md:py-24">
        <h2 className="text-[clamp(1.75rem,3.5vw,2.5rem)] font-medium leading-tight tracking-[-0.02em] text-black">
          Preguntas frecuentes
        </h2>

        {/* Imagen destacada (recortada sin fondo) sobre contenedor gris de marca. */}
        <SectionImage
          src="/faq-operario.webp"
          alt="Operario de Mudanzas X resolviendo dudas frecuentes sobre la mudanza"
          width={826}
          height={1108}
        />

        {/* Acordeón de preguntas (contenido intacto). */}
        <div className="mx-auto mt-12 max-w-[760px] md:mt-16">
            <div className="border-t border-black/10">
              {PREGUNTAS.map((item, i) => {
                const open = abierta === i;
                return (
                  <div key={item.q} className="border-b border-black/10">
                    <button
                      type="button"
                      onClick={() => setAbierta(open ? null : i)}
                      aria-expanded={open}
                      className="flex w-full items-center justify-between gap-6 py-5 text-left"
                    >
                      <span className="text-base font-medium tracking-tight text-black md:text-lg">
                        {item.q}
                      </span>
                      <ChevronDown
                        size={20}
                        strokeWidth={1.5}
                        className={`shrink-0 text-black transition-transform duration-200 ${
                          open ? "rotate-180" : "rotate-0"
                        }`}
                      />
                    </button>
                    <div
                      className={`grid transition-all duration-200 ease-out ${
                        open
                          ? "grid-rows-[1fr] opacity-100"
                          : "grid-rows-[0fr] opacity-0"
                      }`}
                    >
                      <div className="overflow-hidden">
                        <p className="pb-5 pr-8 text-[15px] leading-[1.6] text-black/70">
                          {item.a}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
        </div>
      </div>
    </section>
  );
}
