"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { X } from "lucide-react";
import { btn } from "@/components/ui/button";
import { useConsent } from "./ConsentContext";

// Interruptor accesible para las categorías configurables.
function Toggle({
  checked,
  onChange,
  disabled,
  label,
}: {
  checked: boolean;
  onChange?: (v: boolean) => void;
  disabled?: boolean;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange?.(!checked)}
      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-pill transition-colors duration-150 ${
        checked ? "bg-black" : "bg-black/15"
      } ${disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"}`}
    >
      <span
        className={`inline-block h-5 w-5 transform rounded-pill bg-white shadow transition-transform duration-150 ${
          checked ? "translate-x-[22px]" : "translate-x-0.5"
        }`}
      />
    </button>
  );
}

function Categoria({
  titulo,
  descripcion,
  children,
}: {
  titulo: string;
  descripcion: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4 border-t border-hairline py-4">
      <div>
        <p className="text-sm font-medium text-black">{titulo}</p>
        <p className="mt-1 text-[13px] leading-[1.6] text-black/60">{descripcion}</p>
      </div>
      <div className="pt-0.5">{children}</div>
    </div>
  );
}

export default function CookieBanner() {
  const {
    ready,
    decided,
    consent,
    preferencesOpen,
    acceptAll,
    rejectAll,
    savePreferences,
    openPreferences,
    closePreferences,
  } = useConsent();

  const pathname = usePathname();

  // Estado local de los interruptores del panel de configuración.
  const [analytics, setAnalytics] = useState(consent.analytics);
  const [marketing, setMarketing] = useState(consent.marketing);

  // Al abrir el panel, precargamos los interruptores con la elección vigente.
  useEffect(() => {
    if (preferencesOpen) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setAnalytics(consent.analytics);
      setMarketing(consent.marketing);
    }
  }, [preferencesOpen, consent.analytics, consent.marketing]);

  // El banner es para los visitantes de la web pública. En el panel /admin
  // (solo entra el equipo con login) no tiene sentido, así que no se muestra.
  if (pathname?.startsWith("/admin")) return null;

  // Evita renderizar en el servidor / antes de conocer la elección (sin parpadeos).
  if (!ready) return null;

  const showBanner = !decided && !preferencesOpen;

  return (
    <>
      {/* Banner de primera visita */}
      {showBanner && (
        <div
          role="dialog"
          aria-live="polite"
          aria-label="Aviso de cookies"
          className="fixed inset-x-0 bottom-0 z-[100] border-t border-hairline bg-white/95 backdrop-blur"
        >
          <div className="mx-auto max-w-[1200px] px-6 py-5 md:flex md:items-center md:gap-8">
            <p className="text-[13.5px] leading-[1.65] text-black/70 md:flex-1">
              Usamos cookies propias necesarias para el funcionamiento del sitio y,
              con tu permiso, cookies analíticas y de marketing para medir el uso de
              la web y mostrarte publicidad. Puedes aceptarlas, rechazarlas o
              configurarlas. Más información en nuestra{" "}
              <Link href="/cookies" className="font-medium text-black underline underline-offset-2">
                Política de cookies
              </Link>
              .
            </p>
            <div className="mt-4 flex flex-col gap-2.5 sm:flex-row sm:flex-wrap md:mt-0 md:shrink-0">
              <button
                type="button"
                onClick={openPreferences}
                className={btn({ variant: "secondary", size: "md", className: "order-3 sm:order-1" })}
              >
                Configurar
              </button>
              <button
                type="button"
                onClick={rejectAll}
                className={btn({ variant: "secondary", size: "md", className: "order-2" })}
              >
                Rechazar todas
              </button>
              <button
                type="button"
                onClick={acceptAll}
                className={btn({ variant: "primary", size: "md", className: "order-1 sm:order-3" })}
              >
                Aceptar todas
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Panel de configuración por categorías */}
      {preferencesOpen && (
        <div
          className="fixed inset-0 z-[110] flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-6"
          role="dialog"
          aria-modal="true"
          aria-label="Configuración de cookies"
        >
          <div className="w-full max-w-lg rounded-t-card bg-white p-6 shadow-card sm:rounded-card sm:p-8">
            <div className="flex items-start justify-between gap-4">
              <h2 className="text-lg font-medium tracking-[-0.01em] text-black">
                Configuración de cookies
              </h2>
              <button
                type="button"
                onClick={closePreferences}
                aria-label="Cerrar"
                className="-mr-1 -mt-1 rounded-pill p-1.5 text-black/50 transition-colors duration-150 hover:bg-gris hover:text-black"
              >
                <X size={18} strokeWidth={1.5} />
              </button>
            </div>

            <p className="mt-2 text-[13px] leading-[1.65] text-black/60">
              Elige qué categorías de cookies quieres permitir. Puedes cambiar tu
              elección en cualquier momento desde «Configurar cookies» en el pie de
              página. Consulta la{" "}
              <Link href="/cookies" className="font-medium text-black underline underline-offset-2">
                Política de cookies
              </Link>
              .
            </p>

            <div className="mt-5">
              <Categoria
                titulo="Necesarias"
                descripcion="Imprescindibles para el funcionamiento del sitio y la seguridad. No se pueden desactivar."
              >
                <Toggle checked disabled label="Cookies necesarias (siempre activas)" />
              </Categoria>

              <Categoria
                titulo="Analíticas"
                descripcion="Nos permiten medir de forma agregada cómo se usa la web (Google Analytics) para mejorarla."
              >
                <Toggle
                  checked={analytics}
                  onChange={setAnalytics}
                  label="Cookies analíticas"
                />
              </Categoria>

              <Categoria
                titulo="Marketing"
                descripcion="Se usan para medir campañas y mostrar publicidad relevante (Google Ads, Meta Pixel)."
              >
                <Toggle
                  checked={marketing}
                  onChange={setMarketing}
                  label="Cookies de marketing"
                />
              </Categoria>
            </div>

            <div className="mt-6 flex flex-col gap-2.5 border-t border-hairline pt-5 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={rejectAll}
                className={btn({ variant: "secondary", size: "md" })}
              >
                Rechazar todas
              </button>
              <button
                type="button"
                onClick={acceptAll}
                className={btn({ variant: "secondary", size: "md" })}
              >
                Aceptar todas
              </button>
              <button
                type="button"
                onClick={() => savePreferences({ analytics, marketing })}
                className={btn({ variant: "primary", size: "md" })}
              >
                Guardar preferencias
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
