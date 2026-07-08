"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

type Prefill = {
  origen: string;
  destino: string;
  // Si el hero validó que cada dirección incluye número de calle (para que el
  // formulario no vuelva a exigirlo sobre una dirección ya validada).
  origenValida: boolean;
  destinoValida: boolean;
  // nonce se incrementa en cada "Solicitar presupuesto" para disparar el efecto
  // en el formulario aunque los valores no cambien.
  nonce: number;
};

type QuoteContextValue = {
  prefill: Prefill;
  requestQuote: (
    origen: string,
    destino: string,
    origenValida: boolean,
    destinoValida: boolean
  ) => void;
};

const QuoteContext = createContext<QuoteContextValue | null>(null);

export function QuoteProvider({ children }: { children: ReactNode }) {
  const [prefill, setPrefill] = useState<Prefill>({
    origen: "",
    destino: "",
    origenValida: false,
    destinoValida: false,
    nonce: 0,
  });

  const requestQuote = (
    origen: string,
    destino: string,
    origenValida: boolean,
    destinoValida: boolean
  ) => {
    setPrefill((prev) => ({
      origen,
      destino,
      origenValida,
      destinoValida,
      nonce: prev.nonce + 1,
    }));
  };

  return (
    <QuoteContext.Provider value={{ prefill, requestQuote }}>
      {children}
    </QuoteContext.Provider>
  );
}

export function useQuote() {
  const ctx = useContext(QuoteContext);
  if (!ctx) throw new Error("useQuote debe usarse dentro de QuoteProvider");
  return ctx;
}
