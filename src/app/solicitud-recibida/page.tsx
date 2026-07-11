import type { Metadata } from "next";
import Link from "next/link";
import Topbar from "@/components/Topbar";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import PasosProceso from "@/components/PasosProceso";
import { btn } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Solicitud recibida",
  description: "Hemos recibido tu solicitud de presupuesto.",
  robots: { index: false, follow: false },
};

export default function SolicitudRecibida() {
  return (
    <>
      <Topbar />
      <Header />

      <main className="flex-1">
        <section className="mx-auto flex max-w-[560px] flex-col items-center px-6 py-20 text-center md:py-28">
          {/* Confirmación visual: check monolínea negro dentro de un disco gris,
              con entrada sutil (el disco aparece y el check se dibuja). */}
          <div className="mx-confirm-badge flex h-24 w-24 items-center justify-center rounded-pill bg-gris">
            <svg viewBox="0 0 24 24" aria-hidden className="h-11 w-11">
              <path
                d="M5 12.5l4.5 4.5L19 7"
                pathLength={1}
                className="mx-check-path"
              />
            </svg>
          </div>

          <h1
            className="mx-fade-up mt-8 text-[clamp(2rem,5vw,3rem)] font-medium leading-[1.05] tracking-[-0.02em] text-black"
            style={{ animationDelay: "0.15s" }}
          >
            Solicitud recibida
          </h1>
          <p
            className="mx-fade-up mt-4 text-lg leading-[1.6] text-black/60"
            style={{ animationDelay: "0.25s" }}
          >
            Te contactamos el mismo día laborable con tu presupuesto.
          </p>

          {/* Qué pasa ahora: mismos pasos que "Cómo funciona" (componente
              compartido), pero con el contacto ya marcado como hecho — el
              cliente ve "ya he contactado, ahora vienen estos tres pasos". */}
          <div
            className="mx-fade-up mt-14 w-full max-w-sm"
            style={{ animationDelay: "0.35s" }}
          >
            <p className="text-left text-xs font-medium uppercase tracking-[0.15em] text-black/40">
              Qué pasa ahora
            </p>
            <div className="mt-6">
              <PasosProceso completado="Solicitud recibida" />
            </div>
          </div>

          <Link
            href="/"
            className={btn({ variant: "secondary", size: "md", className: "mx-fade-up mt-14" })}
            style={{ animationDelay: "0.45s" }}
          >
            Volver al inicio
          </Link>
        </section>
      </main>

      <Footer />
    </>
  );
}
