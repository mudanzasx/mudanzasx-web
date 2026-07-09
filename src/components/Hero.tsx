"use client";

import { useState } from "react";
import { useQuote } from "./QuoteContext";
import AddressAutocomplete from "./AddressAutocomplete";
import { usePlaces } from "@/lib/googleMaps";
import { btn } from "@/components/ui/button";
import Image from "next/image";
// Punto de confianza: refuerzo discreto bajo el botón.
const CONFIANZA = [{ texto: "Operativa 365 días" }];

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
    <section id="top" className="w-full bg-gris">
      {/* 1. FRANJA VISUAL: franja a ancho completo con la imagen de marca (render
          monocromo de la península con las rutas desde Barcelona). Va justo
          debajo del bloque fijo. Alto fijo por breakpoint → sin CLS. Fondo negro
          de respaldo mientras carga la imagen (evita destellos blancos).
          Es el LCP: se carga con prioridad. object-cover recorta con gracia; en
          móvil el encuadre se sesga a la derecha para no perder el nodo de
          origen. */}
      <div className="relative h-[200px] w-full overflow-hidden bg-black md:h-[300px]">
        <Image
          src="/hero-peninsula.webp"
          alt="Rutas de mudanza de Mudanzas X desde Barcelona hacia toda la península"
          fill
          priority
          fetchPriority="high"
          quality={82}
          sizes="100vw"
          className="object-cover object-[68%_center] md:object-center"
        />
      </div>

      {/* 2. PANEL DE CONTENIDO: sube sobre la franja (solape con margen superior
          negativo), esquinas superiores redondeadas generosas e inferiores
          rectas, fondo gris. z-10 para quedar por encima de la franja. */}
      <div className="relative z-10 -mt-7 rounded-t-[28px] bg-gris md:-mt-10 md:rounded-t-[40px]">
        <div className="mx-auto max-w-[1200px] px-6 pb-14 pt-10 md:pb-24 md:pt-14">
          <div className="max-w-3xl">
            <h1 className="text-[clamp(2.5rem,6vw,4.5rem)] font-medium leading-[1.05] tracking-[-0.02em] text-black">
              Mudanzas desde y hacia Barcelona
            </h1>
          </div>

          {/* Bloque Origen/Destino estilo Uber */}
          <div className="mt-10 max-w-xl">
            <div className="relative rounded-card border border-hairline bg-white px-4 py-2 shadow-card md:px-5">
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
                  <span className="block h-2.5 w-2.5 rounded-pill bg-black" />
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
                  className="w-full border-b border-hairline bg-transparent py-3 pl-1 text-base text-black placeholder-black/40 outline-none"
                />
              </div>

              {/* Fila Destino */}
              <div className="grid h-14 grid-cols-[20px_1fr] items-center">
                <span className="flex items-center justify-center">
                  <span className="block h-2.5 w-2.5 rounded-pill bg-black" />
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
              <p className="mt-2 text-[13px] font-medium text-black">
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
              className={btn({
                variant: "primary",
                size: "lg",
                className: "mt-4 w-full active:scale-[0.98] sm:w-auto",
              })}
            >
              Solicitar presupuesto
            </button>

            {/* Puntos de confianza (reubicados desde la antigua TrustBand). */}
            <div className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 md:justify-start">
              {CONFIANZA.map(({ texto }) => (
                <span
                  key={texto}
                  className="text-[13px] font-medium tracking-tight text-black/70"
                >
                  {texto}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
