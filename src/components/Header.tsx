"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Phone } from "lucide-react";
import { TELEFONO } from "@/lib/config";

export default function Header() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`overflow-x-clip bg-white transition-[border-color] duration-200 ${
        scrolled ? "border-b border-hairline" : "border-b border-transparent"
      }`}
    >
      <div className="mx-auto flex max-w-[1200px] items-center justify-between px-6 py-4">
        <a href="#top" className="flex items-center" aria-label="Mudanzas X — inicio">
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
            className="hidden h-8 w-auto md:block"
          />
        </a>
        {/* Envoltorio para las ondas (pulse ring): los anillos se dibujan como
            pseudo-elementos de `.mx-call`, detrás del botón y sin capturar
            clics. El botón va con z-[1] para quedar por encima. */}
        <span className="mx-call relative inline-flex">
          <a
            href={`tel:${TELEFONO}`}
            aria-label="Llamar"
            className="relative z-[1] inline-flex items-center justify-center gap-2 rounded-pill bg-black p-2.5 text-sm font-medium text-white transition-colors duration-150 hover:bg-black/85 md:px-5 md:py-2.5"
          >
            <Phone size={16} strokeWidth={1.75} />
            {/* En móvil solo el icono; el texto aparece en escritorio. */}
            <span className="hidden md:inline">Llamar</span>
          </a>
        </span>
      </div>
    </header>
  );
}
