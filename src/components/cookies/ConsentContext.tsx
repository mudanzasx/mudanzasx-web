"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  DEFAULT_CONSENT,
  pushConsentUpdate,
  readStoredConsent,
  writeStoredConsent,
  type ConsentState,
} from "@/lib/consent";

type ConsentContextValue = {
  // Estado actual del consentimiento por categoría.
  consent: ConsentState;
  // ¿El usuario ya ha decidido? Si es false, se muestra el banner de primera visita.
  decided: boolean;
  // ¿Está montado en cliente? Evita parpadeos/hidratación incorrecta.
  ready: boolean;
  // ¿Está abierto el panel de configuración por categorías?
  preferencesOpen: boolean;
  acceptAll: () => void;
  rejectAll: () => void;
  // Guarda una elección concreta por categoría (las necesarias siempre activas).
  savePreferences: (choice: { analytics: boolean; marketing: boolean }) => void;
  openPreferences: () => void;
  closePreferences: () => void;
};

const ConsentContext = createContext<ConsentContextValue | null>(null);

export function ConsentProvider({ children }: { children: React.ReactNode }) {
  const [consent, setConsent] = useState<ConsentState>(DEFAULT_CONSENT);
  const [decided, setDecided] = useState(false);
  const [ready, setReady] = useState(false);
  const [preferencesOpen, setPreferencesOpen] = useState(false);

  // Al montar, recuperamos la elección previa (si existe) y sincronizamos
  // Consent Mode para las visitas recurrentes.
  useEffect(() => {
    const stored = readStoredConsent();
    if (stored) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setConsent(stored);
      setDecided(true);
      pushConsentUpdate(stored);
    }
    setReady(true);
  }, []);

  const apply = useCallback((next: ConsentState) => {
    setConsent(next);
    setDecided(true);
    setPreferencesOpen(false);
    writeStoredConsent(next);
    pushConsentUpdate(next);
  }, []);

  const acceptAll = useCallback(() => {
    apply({ necessary: true, analytics: true, marketing: true });
  }, [apply]);

  const rejectAll = useCallback(() => {
    apply({ necessary: true, analytics: false, marketing: false });
  }, [apply]);

  const savePreferences = useCallback(
    (choice: { analytics: boolean; marketing: boolean }) => {
      apply({ necessary: true, analytics: choice.analytics, marketing: choice.marketing });
    },
    [apply],
  );

  const openPreferences = useCallback(() => setPreferencesOpen(true), []);
  const closePreferences = useCallback(() => setPreferencesOpen(false), []);

  const value = useMemo<ConsentContextValue>(
    () => ({
      consent,
      decided,
      ready,
      preferencesOpen,
      acceptAll,
      rejectAll,
      savePreferences,
      openPreferences,
      closePreferences,
    }),
    [
      consent,
      decided,
      ready,
      preferencesOpen,
      acceptAll,
      rejectAll,
      savePreferences,
      openPreferences,
      closePreferences,
    ],
  );

  return <ConsentContext.Provider value={value}>{children}</ConsentContext.Provider>;
}

export function useConsent(): ConsentContextValue {
  const ctx = useContext(ConsentContext);
  if (!ctx) {
    throw new Error("useConsent debe usarse dentro de <ConsentProvider>");
  }
  return ctx;
}
