"use client";

import { useState } from "react";
import { useQuote } from "./QuoteContext";
import AddressAutocomplete from "./AddressAutocomplete";
import { usePlaces } from "@/lib/googleMaps";

export default function Hero() {
  const { requestQuote } = useQuote();
  const { failed: mapsFailed } = usePlaces();
  const [origen, setOrigen] = useState("");
  const [destino, setDestino] = useState("");
  const [origenNum, setOrigenNum] = useState(false);
  const [destinoNum, setDestinoNum] = useState(false);
  const [intentado, setIntentado] = useState(false);

  // Si Google no está disponible, no bloqueamos por el número (degradación).
  const exigirNumero = !mapsFailed;
  const faltaOrigen = exigirNumero && origen.trim() !== "" && !origenNum;
  const faltaDestino = exigirNumero && destino.trim() !== "" && !destinoNum;

  const handleCalcular = () => {
    setIntentado(true);
    // Una dirección escrita debe llevar número; vacía se deja pasar (el
    // formulario la exigirá como campo obligatorio).
    if (faltaOrigen || faltaDestino) return;
    requestQuote(origen.trim(), destino.trim(), origenNum, destinoNum);
  };

  return (
    <section id="top" className="w-full border-b border-black/10 bg-gris">
      <div className="mx-auto max-w-[1200px] px-6 py-14 md:py-24">
        <div className="max-w-3xl">
          <h1 className="text-[clamp(2.5rem,6vw,4.5rem)] font-medium leading-[1.05] tracking-[-0.02em] text-black">
            Mudanzas desde Barcelona a cualquier punto de la península.
          </h1>
        </div>

        {/* Bloque Origen/Destino estilo Uber */}
        <div className="mt-10 max-w-xl">
          <div className="relative rounded-2xl bg-white px-4 py-2 shadow-sm ring-1 ring-black/5 md:px-5">
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
            <div className="grid h-14 grid-cols-[20px_1fr] items-center">
              <span className="flex items-center justify-center">
                <span className="block h-2.5 w-2.5 rounded-full bg-black" />
              </span>
              <AddressAutocomplete
                value={origen}
                onChange={(v, hasNumber) => {
                  setOrigen(v);
                  setOrigenNum(hasNumber);
                }}
                placeholder="¿Desde dónde?"
                ariaLabel="Origen"
                wrapperClassName="col-start-2"
                className="w-full border-b border-black/10 bg-transparent py-3 pl-1 text-base text-black placeholder-black/40 outline-none"
              />
            </div>

            {/* Fila Destino */}
            <div className="grid h-14 grid-cols-[20px_1fr] items-center">
              <span className="flex items-center justify-center">
                <span className="block h-2.5 w-2.5 rounded-full bg-black" />
              </span>
              <AddressAutocomplete
                value={destino}
                onChange={(v, hasNumber) => {
                  setDestino(v);
                  setDestinoNum(hasNumber);
                }}
                placeholder="¿Hasta dónde?"
                ariaLabel="Destino"
                wrapperClassName="col-start-2"
                className="w-full bg-transparent py-3 pl-1 text-base text-black placeholder-black/40 outline-none"
              />
            </div>
          </div>

          {/* Aviso de número de calle obligatorio */}
          {intentado && (faltaOrigen || faltaDestino) && (
            <p className="mt-2 text-[13px] font-medium text-amber-700">
              Indica el número de la calle en{" "}
              {faltaOrigen && faltaDestino
                ? "el origen y el destino"
                : faltaOrigen
                  ? "el origen"
                  : "el destino"}
              .
            </p>
          )}

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
