import type { Metadata } from "next";
import { Montserrat } from "next/font/google";
import "./globals.css";
import ConsentModeInit from "@/components/cookies/ConsentModeInit";
import { ConsentProvider } from "@/components/cookies/ConsentContext";
import CookieBanner from "@/components/cookies/CookieBanner";
import AnalyticsScripts from "@/components/cookies/AnalyticsScripts";

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
});

// SEO base del sitio. Los iconos (favicon.ico, icon.svg, apple-icon.png) se
// sirven por convención de archivos de Next (src/app), y el manifest por
// src/app/manifest.ts, así que no hace falta declararlos aquí.
//
// El `template` de título hace que cada página pueda exportar solo su nombre
// (p. ej. `title: "Aviso legal"`) y herede el sufijo "· Mudanzas X". Para
// futuras rutas por ciudad (mudanzas Barcelona → [Ciudad]) basta con exportar
// su propia `metadata` con title/description específicos.
const OG_DESCRIPTION =
  "Mudanzas desde Barcelona a toda la península. Pide tu presupuesto online: precio calculado con datos reales, cobertura nacional y servicio con seguro.";

export const metadata: Metadata = {
  metadataBase: new URL("https://www.mudanzasx.com"),
  title: {
    // Home: título literal (el template no se aplica al `default`), keywords sin
    // repetir la marca tres veces. Coherente con el contenido visible, que habla
    // de "Barcelona" y "península" (Hero, FAQ, Servicios).
    default: "Mudanzas en Barcelona a toda la península | Mudanzas X",
    template: "%s · Mudanzas X",
  },
  description: OG_DESCRIPTION,
  applicationName: "Mudanzas X",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "es_ES",
    siteName: "Mudanzas X",
    url: "https://www.mudanzasx.com",
    title: "Mudanzas en Barcelona a toda la península | Mudanzas X",
    description: OG_DESCRIPTION,
    images: [
      {
        url: "/og.png",
        width: 1200,
        height: 630,
        alt: "Mudanzas X - mudanzas desde y hacia Barcelona",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Mudanzas en Barcelona a toda la península | Mudanzas X",
    description: OG_DESCRIPTION,
    images: ["/og.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`${montserrat.variable} h-full`}>
      <body className="min-h-full flex flex-col bg-white text-black">
        {/* Consent Mode v2: fija el estado por defecto (denegado) antes de cargar
            cualquier etiqueta de analítica/marketing. Debe ir dentro de <body>
            (no como hijo directo de <html>); Next inyecta el script
            beforeInteractive en el <head> de todos modos. */}
        <ConsentModeInit />
        <ConsentProvider>
          {children}
          {/* Banner de cookies + panel de configuración (primera visita y reapertura). */}
          <CookieBanner />
          {/* Huecos preparados para GA4 / Google Ads / Meta Pixel, condicionados al consentimiento. */}
          <AnalyticsScripts />
        </ConsentProvider>
      </body>
    </html>
  );
}
