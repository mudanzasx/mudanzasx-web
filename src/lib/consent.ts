// Gestión del consentimiento de cookies (RGPD / LSSI + guía AEPD).
//
// Modelo: tres categorías. Las "necesarias" están siempre activas y no se pueden
// desactivar. Las "analíticas" y de "marketing" requieren consentimiento explícito
// y, mientras no se conceda, NO se cargan sus scripts (bloqueo previo).
//
// La elección se guarda en localStorage del propio navegador, de modo que se
// recuerda entre visitas y puede reabrirse/modificarse cuando el usuario quiera.

export type ConsentCategory = "necessary" | "analytics" | "marketing";

export type ConsentState = {
  // Siempre true: cookies técnicas imprescindibles para el funcionamiento del sitio.
  necessary: true;
  analytics: boolean;
  marketing: boolean;
};

// Estructura persistida en localStorage (con versión para futuras migraciones).
type StoredConsent = {
  v: number;
  analytics: boolean;
  marketing: boolean;
  ts: number; // marca de tiempo del consentimiento (epoch ms)
};

export const CONSENT_STORAGE_KEY = "mx_cookie_consent";
const CONSENT_VERSION = 1;

// Estado por defecto antes de que el usuario decida: todo lo opcional, denegado.
export const DEFAULT_CONSENT: ConsentState = {
  necessary: true,
  analytics: false,
  marketing: false,
};

// Lee la elección guardada. Devuelve null si el usuario aún no ha decidido
// (en ese caso hay que mostrar el banner).
export function readStoredConsent(): ConsentState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(CONSENT_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<StoredConsent>;
    if (parsed.v !== CONSENT_VERSION) return null;
    return {
      necessary: true,
      analytics: Boolean(parsed.analytics),
      marketing: Boolean(parsed.marketing),
    };
  } catch {
    return null;
  }
}

// Persiste la elección del usuario.
export function writeStoredConsent(consent: ConsentState): void {
  if (typeof window === "undefined") return;
  const payload: StoredConsent = {
    v: CONSENT_VERSION,
    analytics: consent.analytics,
    marketing: consent.marketing,
    ts: Date.now(),
  };
  try {
    window.localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // Si localStorage no está disponible (modo privado, cuota, etc.) no rompemos.
  }
}

// ---------------------------------------------------------------------------
// Google Consent Mode v2
// ---------------------------------------------------------------------------
// Traducimos nuestras categorías a las señales de consentimiento de Google.
// Se envían mediante gtag('consent', 'update', ...) cada vez que cambia la
// elección. El estado por defecto ("denied") se fija en ConsentModeInit antes
// de cargar cualquier etiqueta.

type ConsentSignal = "granted" | "denied";

export type ConsentModeUpdate = {
  ad_storage: ConsentSignal;
  ad_user_data: ConsentSignal;
  ad_personalization: ConsentSignal;
  analytics_storage: ConsentSignal;
};

export function toConsentModeUpdate(consent: ConsentState): ConsentModeUpdate {
  const marketing: ConsentSignal = consent.marketing ? "granted" : "denied";
  const analytics: ConsentSignal = consent.analytics ? "granted" : "denied";
  return {
    ad_storage: marketing,
    ad_user_data: marketing,
    ad_personalization: marketing,
    analytics_storage: analytics,
  };
}

// Tipado mínimo de gtag/dataLayer en window para no depender de librerías.
declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

// Empuja la actualización de consentimiento a Google (si gtag ya existe) o a la
// dataLayer (para que quede en cola hasta que se cargue la etiqueta).
export function pushConsentUpdate(consent: ConsentState): void {
  if (typeof window === "undefined") return;
  const update = toConsentModeUpdate(consent);
  if (typeof window.gtag === "function") {
    window.gtag("consent", "update", update);
  } else {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push(["consent", "update", update]);
  }
}
