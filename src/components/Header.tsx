"use client";

import { useEffect, useState } from "react";
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
      className={`sticky top-0 z-50 bg-white transition-[border-color] duration-200 ${
        scrolled ? "border-b border-black/10" : "border-b border-transparent"
      }`}
    >
      <div className="mx-auto flex max-w-[1200px] items-center justify-between px-6 py-4">
        <a
          href="#top"
          className="text-2xl font-medium tracking-tight text-black"
        >
          Mudanzas X
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
