"use client";

import { useState } from "react";
import { Circle, Square } from "lucide-react";
import { useQuote } from "./QuoteContext";

export default function Hero() {
  const { requestQuote } = useQuote();
  const [origen, setOrigen] = useState("Barcelona");
  const [destino, setDestino] = useState("");

  const handleCalcular = () => {
    requestQuote(origen.trim(), destino.trim());
  };

  return (
    <section id="top" className="w-full">
      <div className="mx-auto max-w-[1200px] px-6 py-14 md:py-24">
        <div className="max-w-3xl">
          <h1 className="text-[clamp(2.5rem,6vw,4.5rem)] font-medium leading-[1.05] tracking-[-0.02em] text-black">
            Mudanzas desde Barcelona a cualquier punto de la península.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-[1.6] text-black/70">
            Un sistema que calcula tu mudanza con datos reales: volumen,
            distancia y equipo. Precio claro antes de reservar.
          </p>
        </div>

        {/* Bloque Origen/Destino estilo Uber */}
        <div className="mt-10 max-w-xl">
          <div className="relative rounded-2xl bg-gris p-4 md:p-6">
            {/* Línea vertical que conecta los dos marcadores */}
            <div
              aria-hidden
              className="absolute left-[30px] top-[38px] h-[calc(100%-76px)] w-px bg-black/25 md:left-[38px] md:top-[46px] md:h-[calc(100%-92px)]"
            />

            <label className="relative flex items-center gap-4">
              <Circle
                size={12}
                strokeWidth={0}
                className="shrink-0 fill-black"
                aria-hidden
              />
              <span className="sr-only">Origen</span>
              <input
                type="text"
                value={origen}
                onChange={(e) => setOrigen(e.target.value)}
                placeholder="Origen"
                className="w-full bg-transparent py-3 text-base text-black placeholder-black/40 outline-none"
              />
            </label>

            <div className="ml-[26px] h-px bg-black/10 md:ml-[34px]" />

            <label className="relative flex items-center gap-4">
              <Square
                size={11}
                strokeWidth={0}
                className="shrink-0 fill-black"
                aria-hidden
              />
              <span className="sr-only">Destino</span>
              <input
                type="text"
                value={destino}
                onChange={(e) => setDestino(e.target.value)}
                placeholder="Destino"
                className="w-full bg-transparent py-3 text-base text-black placeholder-black/40 outline-none"
              />
            </label>
          </div>

          <button
            type="button"
            onClick={handleCalcular}
            className="mt-4 w-full rounded-full bg-black px-8 py-4 text-base font-medium text-white transition-colors duration-150 hover:bg-black/85 sm:w-auto"
          >
            Calcular presupuesto
          </button>
        </div>
      </div>
    </section>
  );
}
