import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
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
      {/* Destino final tras enviar el formulario: sin topbar del descuento ni
          navegación de secciones (scrollspy). Solo una cabecera mínima con el
          logo, enlazado al inicio, para orientar y poder volver. */}
      <header className="border-b border-hairline">
        <div className="mx-auto flex max-w-[1200px] items-center px-6 py-2.5">
          <Link
            href="/"
            aria-label="Mudanzas X — inicio"
            className="flex items-center rounded-field outline-none focus-visible:ring-2 focus-visible:ring-black/40"
          >
            {/* Móvil: solo el icono (la X). Escritorio: logo completo. */}
            <Image
              src="/icon-black.svg"
              alt="Mudanzas X"
              width={512}
              height={512}
              priority
              unoptimized
              className="h-7 w-auto md:hidden"
            />
            <Image
              src="/logo-black.svg"
              alt="Mudanzas X"
              width={2453}
              height={512}
              priority
              unoptimized
              className="hidden h-7 w-auto md:block"
            />
          </Link>
        </div>
      </header>

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

          {/* Lo esencial: el contacto ya marcado como hecho y los tres pasos de
              lo que viene ahora (componente compartido con "Cómo funciona"). */}
          <div
            className="mx-fade-up mt-12 w-full max-w-sm"
            style={{ animationDelay: "0.25s" }}
          >
            <PasosProceso completado="Solicitud recibida" />
          </div>

          <Link
            href="/"
            className={btn({ variant: "secondary", size: "md", className: "mx-fade-up mt-14" })}
            style={{ animationDelay: "0.35s" }}
          >
            Volver al inicio
          </Link>
        </section>
      </main>

      <Footer />
    </>
  );
}
