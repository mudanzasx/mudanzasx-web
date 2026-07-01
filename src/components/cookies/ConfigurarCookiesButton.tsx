"use client";

import { useConsent } from "./ConsentContext";

// Enlace para reabrir el panel de configuración de cookies desde el pie de página.
// Se muestra con el mismo estilo que el resto de enlaces legales del footer.
export default function ConfigurarCookiesButton({ className }: { className?: string }) {
  const { openPreferences } = useConsent();
  return (
    <button type="button" onClick={openPreferences} className={className}>
      Configurar cookies
    </button>
  );
}
