import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    // "/admin" (sin barra) cubre tanto la ruta exacta como /admin/*.
    rules: { userAgent: "*", allow: "/", disallow: "/admin" },
    sitemap: "https://www.mudanzasx.com/sitemap.xml",
  };
}
