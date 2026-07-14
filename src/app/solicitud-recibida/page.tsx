import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { Phone } from "lucide-react";
import Footer from "@/components/Footer";
import PasosProceso from "@/components/PasosProceso";
import { btn } from "@/components/ui/button";
import { TELEFONO } from "@/lib/config";

export const metadata: Metadata = {
  title: "Solicitud recibida",
  description: "Hemos recibido tu solicitud de presupuesto.",
  robots: { index: false, follow: false },
};

export default function SolicitudRecibida() {
  return (
    <>
      {/* Destino final tras enviar el formulario: sin topbar del descuento ni
          navegación de secciones (scrollspy). Cabecera mínima con el logo
          (enlazado al inicio) y, al lado opuesto, el botón "Llamar" por si el
          cliente quiere contactar directamente. */}
      <header className="border-b border-hairline">
        <div className="mx-auto flex max-w-[1200px] items-center justify-between px-6 py-2.5">
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

          {/* Botón Llamar con ondas (pulse ring), igual que en la landing. */}
          <span className="mx-call relative inline-flex">
            <a
              href={`tel:${TELEFONO}`}
              aria-label="Llamar"
              className="relative z-[1] inline-flex items-center justify-center gap-2 rounded-pill bg-black p-3 text-sm font-medium text-white transition-colors duration-150 hover:bg-black/85 md:px-5 md:py-2.5"
            >
              <Phone size={16} strokeWidth={1.5} />
              {/* En móvil solo el icono; el texto aparece en escritorio. */}
              <span className="hidden md:inline">Llamar</span>
            </a>
          </span>
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
            ¡Gracias!
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
