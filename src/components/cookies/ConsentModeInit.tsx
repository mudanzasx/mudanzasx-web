import Script from "next/script";

// Inicializa Google Consent Mode v2 ANTES de cargar cualquier etiqueta.
// Fija el estado por defecto en "denied" para analítica y marketing, de modo
// que Google no use cookies de medición/publicidad hasta que el usuario
// consienta (bloqueo previo). La actualización a "granted" la hace el contexto
// de consentimiento vía gtag('consent', 'update', ...) cuando el usuario acepta.
//
// Se carga con strategy="beforeInteractive": Next lo inyecta en el <head>, antes
// del código de la aplicación y de las futuras etiquetas de GA4 / Google Ads.
export default function ConsentModeInit() {
  return (
    // beforeInteractive en el root layout es la ubicación recomendada por Next.js
    // para gestores de consentimiento; la regla de lint apunta al Pages Router.
    // eslint-disable-next-line @next/next/no-before-interactive-script-outside-document
    <Script id="consent-mode-default" strategy="beforeInteractive">
      {`
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        window.gtag = gtag;
        gtag('consent', 'default', {
          ad_storage: 'denied',
          ad_user_data: 'denied',
          ad_personalization: 'denied',
          analytics_storage: 'denied',
          wait_for_update: 500
        });
        gtag('set', 'ads_data_redaction', true);
        gtag('set', 'url_passthrough', true);
      `}
    </Script>
  );
}
