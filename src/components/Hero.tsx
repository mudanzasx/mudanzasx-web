"use client";

import { useState } from "react";
import { useQuote } from "./QuoteContext";

export default function Hero() {
  const { requestQuote } = useQuote();
  const [origen, setOrigen] = useState("");
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
          <div className="relative rounded-2xl bg-gris px-4 py-2 md:px-5">
            {/*
              Carril izquierdo de 20px (columna del grid). Cada fila mide 56px (h-14),
              así el centro del marcador de Origen queda a 8+28=36px y el de Destino a
              8+56+28=92px. La línea conecta exactamente ambos centros: top 36px, alto 56px.
            */}
            <div
              aria-hidden
              className="pointer-events-none absolute top-[36px] left-[26px] h-[56px] w-px -translate-x-1/2 bg-black/30 md:left-[30px]"
            />

            {/* Fila Origen */}
            <label className="grid h-14 grid-cols-[20px_1fr] items-center">
              <span className="flex items-center justify-center">
                <span className="block h-2.5 w-2.5 rounded-full bg-black" />
              </span>
              <span className="sr-only">Origen</span>
              <input
                type="text"
                value={origen}
                onChange={(e) => setOrigen(e.target.value)}
                placeholder="¿Desde dónde?"
                className="col-start-2 w-full border-b border-black/10 bg-transparent py-3 pl-1 text-base text-black placeholder-black/40 outline-none"
              />
            </label>

            {/* Fila Destino */}
            <label className="grid h-14 grid-cols-[20px_1fr] items-center">
              <span className="flex items-center justify-center">
                <span className="block h-2.5 w-2.5 bg-black" />
              </span>
              <span className="sr-only">Destino</span>
              <input
                type="text"
                value={destino}
                onChange={(e) => setDestino(e.target.value)}
                placeholder="¿Hasta dónde?"
                className="col-start-2 w-full bg-transparent py-3 pl-1 text-base text-black placeholder-black/40 outline-none"
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
