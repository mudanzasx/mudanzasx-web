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
      className={`bg-white transition-[border-color] duration-200 ${
        scrolled ? "border-b border-black/10" : "border-b border-transparent"
      }`}
    >
      <div className="relative mx-auto flex max-w-[1200px] items-center justify-end px-6 py-4 md:justify-between">
        {/* En móvil el icono se centra en el header (posición absoluta) y el
            botón "Llamar" queda a la derecha; en escritorio vuelve al flujo
            normal (logo a la izquierda, botón a la derecha). */}
        <a
          href="#top"
          className="absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 items-center md:static md:translate-x-0 md:translate-y-0"
          aria-label="Mudanzas X — inicio"
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
            className="hidden h-8 w-auto md:block"
          />
        </a>
        <a
          href={`tel:${TELEFONO}`}
          className="inline-flex items-center gap-2 rounded-full bg-black px-5 py-2.5 text-sm font-medium text-white transition-colors duration-150 hover:bg-black/85"
        >
          <Phone size={16} strokeWidth={1.75} />
          Llamar
        </a>
      </div>
    </header>
  );
}
