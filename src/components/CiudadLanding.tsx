import Topbar from "./Topbar";
import Header from "./Header";
import TrustBand from "./TrustBand";
import HowItWorks from "./HowItWorks";
import QuoteForm from "./QuoteForm";
import Footer from "./Footer";
import { QuoteProvider } from "./QuoteContext";
import { getRutaCiudad } from "@/lib/rutasCiudad";

// Plantilla de página para una ruta por ciudad (mudanzas de Barcelona a <ciudad>).
// El H1 y el párrafo introductorio son únicos por ciudad (definidos en
// src/lib/rutasCiudad.ts); el resto de secciones (garantías, cómo funciona y el
// formulario) se reutilizan del sitio para no crear páginas vacías ni contenido
// duplicado masivo.
export default function CiudadLanding({ slug }: { slug: string }) {
  const ruta = getRutaCiudad(slug);
  if (!ruta) return null;

  return (
    <>
      <div className="sticky top-0 z-50">
        <Topbar />
        <Header />
      </div>
      <QuoteProvider>
        <main className="flex-1">
          <section id="top" className="w-full">
            <div className="mx-auto max-w-[1200px] px-6 py-14 md:py-24">
              <div className="max-w-3xl">
                <h1 className="text-[clamp(2.5rem,6vw,4.5rem)] font-medium leading-[1.05] tracking-[-0.02em] text-black">
                  {ruta.titulo}
                </h1>
                <p className="mt-6 max-w-2xl text-lg leading-[1.6] text-black/70">
                  {ruta.intro}
                </p>
                <a
                  href="#presupuesto"
                  className="mt-8 inline-flex rounded-full bg-black px-8 py-4 text-base font-medium text-white transition-colors duration-150 hover:bg-black/85"
                >
                  Pedir presupuesto para {ruta.ciudad}
                </a>
              </div>
            </div>
          </section>
          <TrustBand />
          <HowItWorks />
          <QuoteForm />
        </main>
      </QuoteProvider>
      <Footer />
    </>
  );
}
