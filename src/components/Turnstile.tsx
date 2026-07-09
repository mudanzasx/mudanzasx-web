"use client";

import Script from "next/script";
import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";

type TurnstileOptions = {
  sitekey: string;
  callback?: (token: string) => void;
  "error-callback"?: () => void;
  "expired-callback"?: () => void;
  theme?: "light" | "dark" | "auto";
  size?: "normal" | "flexible" | "compact";
};

declare global {
  interface Window {
    turnstile?: {
      render: (el: HTMLElement, opts: TurnstileOptions) => string;
      reset: (id?: string) => void;
      remove: (id?: string) => void;
    };
  }
}

export type TurnstileHandle = { reset: () => void };

const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

// Widget de Cloudflare Turnstile (captcha "managed"). Carga el script de forma
// diferida y renderiza el widget de forma EXPLÍCITA para poder capturar el token
// (callback) y reiniciarlo tras cada envío (Turnstile invalida el token al
// usarse). Si no hay site key configurada, no renderiza nada.
const Turnstile = forwardRef<
  TurnstileHandle,
  { onToken: (token: string) => void; onError?: () => void }
>(function Turnstile({ onToken, onError }, ref) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  // Callbacks en refs siempre frescos (los callbacks nativos de Turnstile se
  // registran una sola vez y no deben quedar atados a un cierre obsoleto).
  const onTokenRef = useRef(onToken);
  const onErrorRef = useRef(onError);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    onTokenRef.current = onToken;
    onErrorRef.current = onError;
  });

  useImperativeHandle(ref, () => ({
    reset() {
      if (widgetIdRef.current && window.turnstile) {
        try {
          window.turnstile.reset(widgetIdRef.current);
        } catch {
          /* el widget puede no existir aún; se ignora */
        }
      }
    },
  }));

  // Si el script ya estaba cargado (p. ej. re-montaje), marca listo sin esperar
  // al onLoad del <Script> (que no vuelve a dispararse).
  useEffect(() => {
    if (window.turnstile) setReady(true);
  }, []);

  useEffect(() => {
    if (!ready || !SITE_KEY || !containerRef.current || widgetIdRef.current) {
      return;
    }
    const t = window.turnstile;
    if (!t) return;
    try {
      widgetIdRef.current = t.render(containerRef.current, {
        sitekey: SITE_KEY,
        callback: (token) => onTokenRef.current(token),
        "error-callback": () => onErrorRef.current?.(),
        "expired-callback": () => onErrorRef.current?.(),
        theme: "light",
        size: "flexible",
      });
    } catch {
      onErrorRef.current?.();
    }
    return () => {
      if (widgetIdRef.current && window.turnstile) {
        try {
          window.turnstile.remove(widgetIdRef.current);
        } catch {
          /* noop */
        }
        widgetIdRef.current = null;
      }
    };
  }, [ready]);

  if (!SITE_KEY) return null;

  return (
    <>
      <Script
        src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
        strategy="afterInteractive"
        onLoad={() => setReady(true)}
        onError={() => onErrorRef.current?.()}
      />
      <div ref={containerRef} />
    </>
  );
});

export default Turnstile;
