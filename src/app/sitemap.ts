import type { MetadataRoute } from "next";

// Sitemap de las páginas indexables (home + legales). No se incluyen /admin
// (disallow en robots) ni /solicitud-recibida (noindex).
export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://www.mudanzasx.com";
  const rutas = [
    "",
    "/aviso-legal",
    "/condiciones",
    "/privacidad",
    "/cookies",
    "/cancelacion",
  ];
  return rutas.map((r) => ({
    url: `${base}${r}`,
    lastModified: new Date(),
    changeFrequency: r === "" ? "weekly" : "yearly",
    priority: r === "" ? 1 : 0.5,
  }));
}
