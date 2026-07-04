import type { Metadata } from "next";

// Patrón de rutas por ciudad para posicionar "mudanzas de Barcelona a [ciudad]".
//
// Para añadir una ciudad nueva:
//   1) Añade su entrada a RUTAS_CIUDAD (solo datos veraces).
//   2) Crea src/app/<slug>/page.tsx copiando la plantilla de Madrid (4 líneas),
//      cambiando únicamente la constante SLUG.
//
// Importante: no inventes cifras (distancias, precios, plazos). Mantén los textos
// genéricos y veraces; el motor de presupuesto es quien da el precio real.

export type RutaCiudad = {
  slug: string; // segmento de URL, p. ej. "mudanzas-barcelona-madrid"
  ciudad: string; // "Madrid"
  titulo: string; // H1 y base del <title> → `${titulo} | Mudanzas X`
  intro: string; // párrafo único de la ruta (contenido visible)
  metaDescription: string; // <meta name="description"> específica de la ruta
};

export const RUTAS_CIUDAD: Record<string, RutaCiudad> = {
  "mudanzas-barcelona-madrid": {
    slug: "mudanzas-barcelona-madrid",
    ciudad: "Madrid",
    titulo: "Mudanzas de Barcelona a Madrid",
    intro:
      "Organizamos tu mudanza de Barcelona a Madrid de principio a fin: recogida, transporte con vehículos propios y entrega, con un precio cerrado antes de reservar y las mercancías aseguradas.",
    metaDescription:
      "Mudanzas de Barcelona a Madrid con precio cerrado antes de reservar. Recogida, transporte con vehículos propios y entrega, con mercancías aseguradas. Pide tu presupuesto.",
  },
};

export function getRutaCiudad(slug: string): RutaCiudad | null {
  return RUTAS_CIUDAD[slug] ?? null;
}

// Genera la Metadata de Next para una ruta de ciudad. Usa `title.absolute` para
// evitar el sufijo del template global y obtener exactamente "<titulo> | Mudanzas X".
export function metadataCiudad(slug: string): Metadata {
  const ruta = RUTAS_CIUDAD[slug];
  if (!ruta) return {};

  const title = `${ruta.titulo} | Mudanzas X`;
  const url = `https://www.mudanzasx.com/${ruta.slug}`;

  return {
    title: { absolute: title },
    description: ruta.metaDescription,
    alternates: { canonical: `/${ruta.slug}` },
    openGraph: {
      type: "website",
      locale: "es_ES",
      siteName: "Mudanzas X",
      url,
      title,
      description: ruta.metaDescription,
      images: [{ url: "/og.png", width: 1200, height: 630, alt: "Mudanzas X" }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: ruta.metaDescription,
      images: ["/og.png"],
    },
  };
}
