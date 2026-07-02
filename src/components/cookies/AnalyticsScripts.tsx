"use client";

import Script from "next/script";
import { Suspense } from "react";
import { useConsent } from "./ConsentContext";
import GaPageView from "./GaPageView";

// ---------------------------------------------------------------------------
// ETIQUETAS DE ANALÍTICA Y MARKETING (condicionadas al consentimiento)
// ---------------------------------------------------------------------------
// GA4 se carga SOLO si el usuario ha aceptado la categoría "analíticas" en el
// banner. El identificador de medición (G-XXXXXXXXXX) llega por variable de
// entorno pública; nunca se escribe a mano aquí.
//
// El estado por defecto de Consent Mode v2 se fija en "denied" en
// ConsentModeInit, y ConsentProvider ya envía gtag('consent','update',...) al
// aceptar/revocar. Aquí solo nos ocupamos de cargar (o no) las etiquetas.
const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

export default function AnalyticsScripts() {
  const { consent, ready } = useConsent();

  // No cargamos nada hasta conocer la elección del usuario en el cliente.
  if (!ready) return null;

  // GA4 solo si hay ID configurado y el usuario aceptó ANALÍTICAS.
  const cargarGA4 = Boolean(GA_MEASUREMENT_ID) && consent.analytics;

  return (
    <>
      {/* ---- Google Analytics 4 (categoría: analíticas) ---- */}
      {cargarGA4 && (
        <>
          <Script
            id="ga4-js"
            strategy="afterInteractive"
            src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
          />
          <Script id="ga4-config" strategy="afterInteractive">
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              window.gtag = gtag;
              gtag('js', new Date());
              // send_page_view:false — las vistas de página las envía GaPageView
              // en cada cambio de ruta (SPA), incluida la carga inicial, para no
              // duplicar la vista inicial de gtag('config', ...).
              gtag('config', '${GA_MEASUREMENT_ID}', { send_page_view: false });
            `}
          </Script>
          {/* Registra page_view en cada navegación interna del App Router. */}
          <Suspense fallback={null}>
            <GaPageView />
          </Suspense>
        </>
      )}

      {/* ------------------------------------------------------------------- */}
      {/* HUECOS PREPARADOS (INACTIVOS) — activar en una fase posterior        */}
      {/* ------------------------------------------------------------------- */}
      {/* TODO(marketing): Google Ads. Cuando se active, cargar gtag.js con su
          ID (AW-XXXXXXXXXX, vía process.env.NEXT_PUBLIC_GOOGLE_ADS_ID) SOLO si
          `consent.marketing`. Consent Mode ya actualiza ad_storage /
          ad_user_data / ad_personalization a 'granted' cuando el usuario acepta
          marketing (ver toConsentModeUpdate en @/lib/consent). */}
      {/* TODO(marketing): Meta Pixel. Cargar el píxel (fbevents.js con
          NEXT_PUBLIC_META_PIXEL_ID) SOLO si `consent.marketing`. Meta no usa
          Consent Mode: basta con no cargarlo hasta que se acepte marketing. */}
    </>
  );
}
