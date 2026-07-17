import type { MetadataRoute } from "next";

// Sitemap de las páginas indexables (home + legales). No se incluyen /admin
// (disallow en robots) ni /solicitud-recibida (noindex).
// Última modificación real de los textos legales (coincide con LEGAL_ACTUALIZADO
// de config). Fija a propósito: si fuera `new Date()`, cambiaría en cada build y
// sería ruido para los buscadores.
const LEGAL_LASTMOD = new Date("2026-07-01");

export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://www.mudanzasx.com";
  const legales = [
    "/aviso-legal",
    "/condiciones",
    "/privacidad",
    "/cookies",
    "/cancelacion",
  ];
  return [
    {
      url: base,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
    ...legales.map((r) => ({
      url: `${base}${r}`,
      lastModified: LEGAL_LASTMOD,
      changeFrequency: "yearly" as const,
      priority: 0.5,
    })),
  ];
}
