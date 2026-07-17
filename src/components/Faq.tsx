"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { PREGUNTAS } from "@/lib/faq";

export default function Faq() {
  const [abierta, setAbierta] = useState<number | null>(null);

  return (
    // Sección en NEGRO pleno: descanso visual rotundo antes del formulario y
    // hermana de la banda del manifiesto (también negra). Todo el contenido se
    // invierte para leerse sobre negro; las hairlines pasan a blanco muy sutil.
    <section id="faq" className="w-full border-t border-white/40 bg-black">
      {/* Sin imagen: el acordeón se centra a un ancho cómodo de lectura (800px)
          en lugar de encajonarse en media rejilla. */}
      <div className="mx-auto max-w-[800px] px-6 py-14 md:py-24">
        <h2 className="text-[clamp(1.75rem,3.5vw,2.5rem)] font-medium leading-tight tracking-[-0.02em] text-white">
          Preguntas frecuentes
        </h2>

        {/* Acordeón atenuado sobre negro: sin cajas ni fondo propio (cada
            pregunta se funde con el negro de la sección), delimitado solo por una
            hairline blanca. Sobre negro puro hace falta bastante más opacidad
            (40%) que sobre fondos claros para que la línea de 1px se lea nítida y
            delimite cada pregunta como fila pulsable independiente. La línea
            superior del bloque (border-t) y la inferior del último item (border-b)
            lo cierran limpiamente. El chevron refuerza que es desplegable. */}
        <div className="mt-10 border-t border-white/40 md:mt-12">
          {PREGUNTAS.map((item, i) => {
            const open = abierta === i;
            return (
              <div key={item.q} className="border-b border-white/40">
                <button
                  type="button"
                  onClick={() => setAbierta(open ? null : i)}
                  aria-expanded={open}
                  className="flex w-full items-center justify-between gap-6 py-5 text-left outline-none focus-visible:ring-2 focus-visible:ring-white/50"
                >
                  <span className="text-base font-medium tracking-tight text-white md:text-lg">
                    {item.q}
                  </span>
                  <ChevronDown
                    size={20}
                    strokeWidth={1.5}
                    className={`shrink-0 text-white transition-transform duration-200 ${
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
                    <p className="pb-5 text-body leading-[1.6] text-white/70">
                      {item.a}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
