import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { IconCheckCircle } from "@/components/SystemIcons";

export const metadata: Metadata = {
  title: "Solicitud recibida · Mudanzas X",
  description: "Hemos recibido tu solicitud de presupuesto.",
  robots: { index: false, follow: false },
};

export default function SolicitudRecibida() {
  return (
    <main className="flex flex-1 flex-col">
      <header className="w-full border-b border-black/10">
        <div className="mx-auto flex max-w-[1200px] items-center px-6 py-4">
          <Link href="/" aria-label="Mudanzas X — inicio" className="flex items-center">
            <Image
              src="/logo-black.svg"
              alt="Mudanzas X"
              width={2453}
              height={512}
              priority
              unoptimized
              className="h-7 w-auto md:h-8"
            />
          </Link>
        </div>
      </header>

      <div className="flex flex-1 items-center justify-center px-6 py-20 md:py-28">
        <div className="flex max-w-xl flex-col items-center text-center">
          <IconCheckCircle size={56} className="text-black" />

          <h1 className="mt-8 text-[clamp(2rem,5vw,3.25rem)] font-medium leading-[1.05] tracking-[-0.02em] text-black">
            Solicitud recibida
          </h1>

          <p className="mt-5 text-lg leading-[1.6] text-black/70">
            Te contactamos hoy mismo para cerrar tu presupuesto.
          </p>

          <p className="mt-4 text-[15px] leading-[1.6] text-black/50">
            Revisamos volumen, distancia y equipo, y te llamamos para confirmar
            el precio cerrado y la fecha.
          </p>

          <Link
            href="/"
            className="mt-10 inline-flex items-center justify-center rounded-full bg-black px-8 py-4 text-base font-medium text-white transition-colors duration-150 hover:bg-black/85"
          >
            Volver al inicio
          </Link>
        </div>
      </div>
    </main>
  );
}
