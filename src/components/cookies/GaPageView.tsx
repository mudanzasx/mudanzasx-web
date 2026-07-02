"use client";

import { useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";

// Envía un evento page_view de GA4 en cada cambio de ruta del App Router
// (incluida la carga inicial). GA4 se configura con send_page_view:false, de
// modo que TODAS las vistas de una SPA pasan por aquí sin duplicarse.
//
// Solo se monta cuando el consentimiento analítico está concedido (lo controla
// AnalyticsScripts), así que no envía nada si el usuario no aceptó analíticas.
// Usa useSearchParams, por lo que debe renderizarse dentro de un <Suspense>.
export default function GaPageView() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const lastUrl = useRef<string | null>(null);

  // Dependemos de la URL como string (no del objeto searchParams): así el efecto
  // solo se dispara cuando la ruta cambia de verdad, y no por el cambio de
  // referencia de searchParams durante la hidratación (que duplicaría la vista).
  const query = searchParams.toString();
  const url = query ? `${pathname}?${query}` : pathname;

  useEffect(() => {
    if (typeof window.gtag !== "function") return;
    // Guarda anti-duplicado: no reenviamos la misma URL dos veces seguidas.
    if (lastUrl.current === url) return;
    lastUrl.current = url;
    window.gtag("event", "page_view", {
      page_path: url,
      page_location: window.location.href,
      page_title: document.title,
    });
  }, [url]);

  return null;
}
