"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { PREGUNTAS } from "@/lib/faq";

export default function Faq() {
  const [abierta, setAbierta] = useState<number | null>(null);

  return (
    <section id="faq" className="w-full border-t border-hairline bg-gris">
      {/* Sin imagen: el acordeón se centra a un ancho cómodo de lectura (800px)
          en lugar de encajonarse en media rejilla. */}
      <div className="mx-auto max-w-[800px] px-6 py-14 md:py-24">
        <h2 className="text-[clamp(1.75rem,3.5vw,2.5rem)] font-medium leading-tight tracking-[-0.02em] text-black">
          Preguntas frecuentes
        </h2>

        {/* Acordeón atenuado: gris sobre gris (se difumina y cede protagonismo
            al formulario que viene después). Sin cajas ni color: cada pregunta
            se delimita solo con una hairline sutil, lo justo para leerse como
            fila pulsable. El chevron refuerza que es desplegable. */}
        <div className="mt-10 border-t border-hairline md:mt-12">
          {PREGUNTAS.map((item, i) => {
            const open = abierta === i;
            return (
              <div key={item.q} className="border-b border-hairline">
                <button
                  type="button"
                  onClick={() => setAbierta(open ? null : i)}
                  aria-expanded={open}
                  className="flex w-full items-center justify-between gap-6 py-5 text-left outline-none focus-visible:ring-2 focus-visible:ring-black/40"
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
                    <p className="pb-5 text-[15px] leading-[1.6] text-black/70">
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
