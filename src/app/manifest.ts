import type { MetadataRoute } from "next";

// Manifest de la PWA: permite instalar la web en el móvil con un buen icono
// (X blanca sobre negro). Next lo sirve en /manifest.webmanifest y añade el
// <link rel="manifest"> automáticamente.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Mudanzas X",
    short_name: "Mudanzas X",
    description:
      "Mudanzas desde Barcelona a toda la península. Presupuesto rápido con datos reales.",
    start_url: "/",
    display: "standalone",
    lang: "es",
    theme_color: "#000000",
    background_color: "#ffffff",
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
