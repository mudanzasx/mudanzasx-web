"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Phone } from "lucide-react";
import { TELEFONO, TELEFONO_TEXTO } from "@/lib/config";

// Secciones de la landing en orden de aparición (scrollspy). El id coincide con
// el del <section> en el DOM ("top" es el hero). `short` es la etiqueta
// abreviada para la fila de navegación móvil, donde deben caber las 5 enteras a
// 360px. "Comenzar" nunca se abrevia ni se corta.
const SECTIONS = [
  { id: "top", label: "Inicio", short: "Inicio" },
  { id: "servicios", label: "Servicios", short: "Servicios" },
  { id: "como-funciona", label: "Cómo funciona", short: "Proceso" },
  { id: "faq", label: "Preguntas", short: "FAQ" },
  { id: "presupuesto", label: "Comenzar", short: "Comenzar" },
] as const;

// Última entrada: llamada a la acción, siempre destacada.
const CTA_ID = "presupuesto";

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  // Sección activa del scrollspy. Se inicia en el hero ("top") para que al
  // cargar arriba del todo "Inicio" ya salga resaltado sin parpadeo.
  const [active, setActive] = useState<string | null>("top");

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Scrollspy (antes en SectionNav): marca la sección visible. Mide la altura
  // real del bloque fijo (#mx-fixed-top) para el rootMargin, así la sección se
  // marca activa cuando su inicio queda justo bajo el bloque. Se rehace al
  // redimensionar porque la altura cambia entre móvil (2 filas) y escritorio.
  useEffect(() => {
    const els = SECTIONS.map((s) => document.getElementById(s.id)).filter(
      (el): el is HTMLElement => el !== null,
    );
    if (els.length === 0) return;

    const visible = new Set<string>();
    let observer: IntersectionObserver | null = null;

    const build = () => {
      observer?.disconnect();
      const fixed = document.getElementById("mx-fixed-top");
      const top = fixed ? Math.round(fixed.getBoundingClientRect().height) : 110;
      observer = new IntersectionObserver(
        (entries) => {
          for (const e of entries) {
            if (e.isIntersecting) visible.add(e.target.id);
            else visible.delete(e.target.id);
          }
          const first = SECTIONS.find((s) => visible.has(s.id));
          if (first) setActive(first.id);
        },
        { rootMargin: `-${top}px 0px -55% 0px`, threshold: 0 },
      );
      els.forEach((el) => observer!.observe(el));
    };

    build();

    let raf = 0;
    const onResize = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(build);
    };
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
      cancelAnimationFrame(raf);
      observer?.disconnect();
    };
  }, []);

  // Enlaces de navegación. `variant` controla la etiqueta (corta en móvil,
  // completa en escritorio) y el padding. "Comenzar" (CTA) siempre destacado;
  // el resto solo cuando su sección está activa.
  const navLinks = (variant: "desktop" | "mobile") =>
    SECTIONS.map((s) => {
      const isActive = active === s.id;
      const isCta = s.id === CTA_ID;
      const highlighted = isActive || isCta;
      return (
        <li key={s.id} className="min-w-0">
          <a
            href={`#${s.id}`}
            aria-current={isActive ? "true" : undefined}
            className={`inline-block whitespace-nowrap rounded-field outline-none transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-black/40 ${
              variant === "mobile" ? "px-1 py-0.5" : "px-1.5 py-1"
            } ${
              highlighted
                ? "font-medium text-black"
                : "font-normal text-black/40 hover:text-black/70"
            } ${
              isCta
                ? `underline decoration-1 underline-offset-4 ${
                    isActive ? "decoration-black/60" : "decoration-black/25"
                  }`
                : ""
            }`}
          >
            {variant === "mobile" ? s.short : s.label}
          </a>
        </li>
      );
    });

  return (
    <header
      className={`overflow-x-clip bg-white transition-[border-color] duration-200 ${
        scrolled ? "border-b border-hairline" : "border-b border-transparent"
      }`}
    >
      {/* Fila principal, compacta. Móvil = flex (icono + botón Llamar).
          Escritorio = grid de 3 columnas [1fr auto 1fr] para centrar con
          precisión la navegación entre el logo y el botón. */}
      <div className="mx-auto flex max-w-[1200px] items-center justify-between px-6 py-1.5 md:grid md:grid-cols-[1fr_auto_1fr] md:py-2.5">
        <a
          href="#top"
          className="flex items-center md:justify-self-start"
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
            className="hidden h-7 w-auto md:block"
          />
        </a>

        {/* Navegación centrada — solo escritorio. */}
        <nav
          aria-label="Secciones de la página"
          className="hidden md:block md:justify-self-center"
        >
          <ul className="flex items-center gap-6 text-[13px] tracking-tight">
            {navLinks("desktop")}
          </ul>
        </nav>

        {/* Contacto (columna derecha del grid). Dos versiones excluyentes:
            móvil = botón; escritorio = número visible. */}
        <div className="md:justify-self-end">
          {/* Móvil: botón compacto negro con solo el icono y ondas (pulse ring):
              los anillos son pseudo-elementos de `.mx-call`, detrás del botón y
              sin capturar clics. Al ser `md:hidden`, ni el botón ni las ondas se
              renderizan en escritorio (sin rastro ni overflow). Zona pulsable ≥40px. */}
          <span className="mx-call relative inline-flex md:hidden">
            <a
              href={`tel:${TELEFONO}`}
              aria-label="Llamar"
              className="relative z-[1] inline-flex items-center justify-center gap-2 rounded-pill bg-black p-3 text-sm font-medium text-white transition-colors duration-150 hover:bg-black/85"
            >
              <Phone size={16} strokeWidth={1.5} />
            </a>
          </span>

          {/* Escritorio: el número como información de contacto legible, no un
              botón (sin fondo ni píldora). Icono fino a la izquierda; el propio
              número es el texto del enlace (accesible sin aria-label). Hover
              sutil (subrayado) para indicar que es pulsable. */}
          <a
            href={`tel:${TELEFONO}`}
            className="hidden items-center gap-2 rounded-field text-[13px] font-medium tracking-tight text-black underline-offset-4 outline-none hover:underline focus-visible:ring-2 focus-visible:ring-black/40 md:inline-flex"
          >
            <Phone size={16} strokeWidth={1.5} aria-hidden />
            {TELEFONO_TEXTO}
          </a>
        </div>
      </div>

      {/* Fila de navegación ultrafina — solo móvil. Las 5 etiquetas cortas se
          reparten el ancho (justify-between): caben enteras a 360px, sin scroll
          horizontal y sin cortar "Comenzar". Separada por una hairline. */}
      <nav
        aria-label="Secciones de la página"
        className="border-t border-hairline md:hidden"
      >
        <ul className="mx-auto flex max-w-[1200px] items-center justify-between gap-1 px-3 py-1.5 text-[11px] tracking-tight">
          {navLinks("mobile")}
        </ul>
      </nav>
    </header>
  );
}
