import Link from "next/link";
import Image from "next/image";
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

      <main className="flex-1">
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
