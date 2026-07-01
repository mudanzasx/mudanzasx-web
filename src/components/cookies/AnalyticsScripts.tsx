"use client";

import Script from "next/script";
import { useConsent } from "./ConsentContext";

// ---------------------------------------------------------------------------
// HUECOS PARA LAS ETIQUETAS DE ANALÍTICA Y MARKETING
// ---------------------------------------------------------------------------
// Rellena estos identificadores en la fase de analítica. Mientras estén vacíos,
// NO se carga ninguna etiqueta (bloqueo previo). Además, cada bloque solo se
// monta si el usuario ha consentido su categoría; el estado por defecto de
// Google Consent Mode v2 se fija en "denied" en ConsentModeInit.
//
// Se tipan como `string` (no como literal "") para que puedan rellenarse sin
// falsos avisos del compilador.
const GA4_MEASUREMENT_ID: string = ""; // p. ej. "G-XXXXXXXXXX"
const GOOGLE_ADS_ID: string = ""; // p. ej. "AW-XXXXXXXXXX"
const META_PIXEL_ID: string = ""; // p. ej. "123456789012345"

export default function AnalyticsScripts() {
  const { consent, ready } = useConsent();

  // No cargamos nada hasta conocer la elección del usuario en el cliente.
  if (!ready) return null;

  const cargarGoogle = Boolean(GA4_MEASUREMENT_ID || GOOGLE_ADS_ID);

  return (
    <>
      {/* ---- Google Analytics 4 + Google Ads (categoría: analíticas / marketing) ---- */}
      {/* La librería gtag.js es común a GA4 y Google Ads. La cargamos si hay algún
          ID configurado y si el usuario aceptó analíticas o marketing. El consentimiento
          fino por producto ya lo controla Consent Mode (analytics_storage / ad_storage). */}
      {cargarGoogle && (consent.analytics || consent.marketing) && (
        <>
          <Script
            id="gtag-js"
            strategy="afterInteractive"
            src={`https://www.googletagmanager.com/gtag/js?id=${GA4_MEASUREMENT_ID || GOOGLE_ADS_ID}`}
          />
          <Script id="gtag-config" strategy="afterInteractive">
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              ${GA4_MEASUREMENT_ID ? `gtag('config', '${GA4_MEASUREMENT_ID}');` : ""}
              ${GOOGLE_ADS_ID ? `gtag('config', '${GOOGLE_ADS_ID}');` : ""}
            `}
          </Script>
        </>
      )}

      {/* ---- Meta Pixel (categoría: marketing) ---- */}
      {/* Meta no usa Consent Mode: basta con no cargar el píxel hasta que el
          usuario acepte marketing. */}
      {META_PIXEL_ID && consent.marketing && (
        <Script id="meta-pixel" strategy="afterInteractive">
          {`
            !function(f,b,e,v,n,t,s)
            {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};
            if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
            n.queue=[];t=b.createElement(e);t.async=!0;
            t.src=v;s=b.getElementsByTagName(e)[0];
            s.parentNode.insertBefore(t,s)}(window, document,'script',
            'https://connect.facebook.net/en_US/fbevents.js');
            fbq('init', '${META_PIXEL_ID}');
            fbq('track', 'PageView');
          `}
        </Script>
      )}
    </>
  );
}
