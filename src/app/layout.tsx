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
  weight: ["400", "500"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Mudanzas X · Mudanzas desde Barcelona a toda la península",
  description:
    "Un sistema que calcula tu mudanza con datos reales: volumen, distancia y equipo. Precio claro antes de reservar.",
  icons: {
    icon: [
      { url: "/icon-black.svg", type: "image/svg+xml", media: "(prefers-color-scheme: light)" },
      { url: "/icon-white.svg", type: "image/svg+xml", media: "(prefers-color-scheme: dark)" },
    ],
    apple: [{ url: "/icon-black.svg", type: "image/svg+xml" }],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`${montserrat.variable} h-full`}>
      {/* Consent Mode v2: fija el estado por defecto (denegado) antes de cargar
          cualquier etiqueta de analítica/marketing. */}
      <ConsentModeInit />
      <body className="min-h-full flex flex-col bg-white text-black">
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
