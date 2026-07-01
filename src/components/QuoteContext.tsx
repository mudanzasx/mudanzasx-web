"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

type Prefill = {
  origen: string;
  destino: string;
  // nonce se incrementa en cada "Calcular presupuesto" para disparar el efecto
  // en el formulario aunque los valores no cambien.
  nonce: number;
};

type QuoteContextValue = {
  prefill: Prefill;
  requestQuote: (origen: string, destino: string) => void;
};

const QuoteContext = createContext<QuoteContextValue | null>(null);

export function QuoteProvider({ children }: { children: ReactNode }) {
  const [prefill, setPrefill] = useState<Prefill>({
    origen: "",
    destino: "",
    nonce: 0,
  });

  const requestQuote = (origen: string, destino: string) => {
    setPrefill((prev) => ({ origen, destino, nonce: prev.nonce + 1 }));
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
