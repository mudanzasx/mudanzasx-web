import type { Metadata } from "next";
import CiudadLanding from "@/components/CiudadLanding";
import { metadataCiudad } from "@/lib/rutasCiudad";

// Plantilla replicable de ruta por ciudad. Para una ciudad nueva:
//   1) Añade su entrada en src/lib/rutasCiudad.ts.
//   2) Copia esta carpeta a src/app/<nuevo-slug>/ y cambia SLUG.
// Title resultante: "Mudanzas de Barcelona a Madrid | Mudanzas X".
const SLUG = "mudanzas-barcelona-madrid";

export const metadata: Metadata = metadataCiudad(SLUG);

export default function Page() {
  return <CiudadLanding slug={SLUG} />;
}
