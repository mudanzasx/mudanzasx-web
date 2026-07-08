import type { Metadata } from "next";
import Link from "next/link";
import Topbar from "@/components/Topbar";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { btn } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Solicitud recibida",
  description: "Hemos recibido tu solicitud de presupuesto.",
  robots: { index: false, follow: false },
};

// Próximos pasos del proceso, en secuencia breve.
const PASOS = [
  "Hemos recibido tu solicitud.",
  "Te llamamos para conocer los detalles de tu mudanza: inventario, accesos y fechas.",
  "Cerramos tu presupuesto y, si te encaja, reservas tu fecha.",
];

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
            Te contactamos hoy mismo con tu presupuesto cerrado.
          </p>

          {/* Próximos pasos: secuencia numerada sobria, círculos grises unidos
              por una fina línea de progresión. */}
          <div
            className="mx-fade-up mt-14 w-full max-w-sm"
            style={{ animationDelay: "0.35s" }}
          >
            <p className="text-left text-xs font-medium uppercase tracking-[0.15em] text-black/40">
              Qué pasa ahora
            </p>
            <ol className="mt-6 text-left">
              {PASOS.map((paso, i) => (
                <li key={paso} className="relative flex gap-4 pb-7 last:pb-0">
                  {i < PASOS.length - 1 && (
                    <span
                      aria-hidden
                      className="absolute bottom-0 left-[15px] top-8 w-px bg-black/10"
                    />
                  )}
                  <span className="relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-pill bg-gris text-xs font-medium tabular-nums text-black">
                    {i + 1}
                  </span>
                  <p className="pt-[5px] text-[15px] leading-[1.55] text-black/70">
                    {paso}
                  </p>
                </li>
              ))}
            </ol>
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
