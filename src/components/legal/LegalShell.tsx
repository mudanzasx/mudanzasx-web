import Link from "next/link";
import Image from "next/image";
import { ArrowLeft } from "lucide-react";
import Footer from "@/components/Footer";
import { LEGAL_ACTUALIZADO } from "@/lib/config";

// Estructura compartida por las tres páginas legales: cabecera mínima con el
// logo (enlace al inicio), título, fecha de última actualización y el contenido
// dentro de un contenedor tipográfico legible (.legal-prose), más el pie común.
export default function LegalShell({
  titulo,
  children,
}: {
  titulo: string;
  children: React.ReactNode;
}) {
  return (
    <>
      {/* Rejilla de 3 columnas [1fr auto 1fr]: el logo queda centrado con
          precisión mientras el botón "Volver al inicio" ocupa el lado izquierdo
          y un hueco simétrico equilibra la derecha. Sticky (top-0): acompaña al
          scroll para que el logo y el botón de volver estén siempre accesibles
          en las páginas largas. Al ser sticky va en el flujo, reserva su hueco →
          sin CLS y sin tapar el contenido al cargar (no hace falta offset). */}
      <header className="sticky top-0 z-40 w-full bg-black">
        <div className="mx-auto grid max-w-[1200px] grid-cols-[1fr_auto_1fr] items-center px-6 py-3 md:py-4">
          <Link
            href="/"
            aria-label="Volver al inicio"
            className="inline-flex h-9 w-9 items-center justify-center justify-self-start rounded-pill text-white outline-none transition-colors duration-150 hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-white/50"
          >
            <ArrowLeft size={20} strokeWidth={1.5} aria-hidden />
          </Link>

          <Link
            href="/"
            aria-label="Mudanzas X — inicio"
            className="flex items-center justify-self-center rounded-field outline-none focus-visible:ring-2 focus-visible:ring-white/50"
          >
            {/* Móvil: solo el icono (la X en blanco). Escritorio: logo completo. */}
            <Image
              src="/icon-white.svg"
              alt="Mudanzas X"
              width={512}
              height={512}
              priority
              unoptimized
              className="h-7 w-auto md:hidden"
            />
            <Image
              src="/logo-white.svg"
              alt="Mudanzas X"
              width={2453}
              height={512}
              priority
              unoptimized
              className="hidden h-8 w-auto md:block"
            />
          </Link>

          {/* Hueco simétrico para mantener el logo centrado. */}
          <span aria-hidden className="justify-self-end" />
        </div>
      </header>

      <main className="min-w-0 flex-1 overflow-x-hidden">
        <div className="mx-auto max-w-[760px] px-6 py-14 md:py-20">
          <h1 className="text-[clamp(1.9rem,4vw,2.75rem)] font-medium leading-[1.1] tracking-[-0.02em] text-black">
            {titulo}
          </h1>
          <p className="mt-4 text-sm text-black/50">
            Última actualización: {LEGAL_ACTUALIZADO}
          </p>

          <div className="legal-prose mt-10">{children}</div>
        </div>
      </main>

      <Footer />
    </>
  );
}
