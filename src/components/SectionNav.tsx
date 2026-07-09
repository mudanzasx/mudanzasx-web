"use client";

import { useEffect, useState } from "react";

// Secciones de la landing en orden de aparición. El id coincide con el del
// <section> correspondiente ya presente en el DOM ("top" es el hero).
// `short` es la etiqueta abreviada que se usa solo en móvil para que las 5
// entradas quepan enteras (~360px). "Comenzar" nunca se abrevia ni se corta.
const SECTIONS = [
  { id: "top", label: "Inicio", short: "Inicio" },
  { id: "como-funciona", label: "Cómo funciona", short: "Proceso" },
  { id: "servicios", label: "Servicios", short: "Servicios" },
  { id: "faq", label: "Preguntas", short: "FAQ" },
  { id: "presupuesto", label: "Comenzar", short: "Comenzar" },
] as const;

// Última entrada: es la llamada a la acción y va siempre destacada.
const CTA_ID = "presupuesto";

export default function SectionNav() {
  // id de la sección activa. Se inicia en el hero ("top") para que al cargar
  // arriba del todo "Inicio" ya salga resaltado sin parpadeo; el observer lo
  // corrige de inmediato si la página carga desplazada (enlace directo).
  const [active, setActive] = useState<string | null>("top");

  useEffect(() => {
    const els = SECTIONS.map((s) => document.getElementById(s.id)).filter(
      (el): el is HTMLElement => el !== null,
    );
    if (els.length === 0) return;

    // Secciones actualmente dentro de la banda de detección.
    const visible = new Set<string>();
    let observer: IntersectionObserver | null = null;

    // Construye (o reconstruye) el observer midiendo la altura real del bloque
    // fijo superior (topbar + header + esta barra). Ese alto se usa como
    // rootMargin superior para que una sección se marque activa cuando su
    // inicio queda justo bajo la barra, no antes. Se rehace al redimensionar
    // porque la altura del bloque cambia entre móvil y escritorio.
    const build = () => {
      observer?.disconnect();
      const fixed = document.getElementById("mx-fixed-top");
      const top = fixed ? Math.round(fixed.getBoundingClientRect().height) : 148;
      observer = new IntersectionObserver(
        (entries) => {
          for (const e of entries) {
            if (e.isIntersecting) visible.add(e.target.id);
            else visible.delete(e.target.id);
          }
          // Activa la primera sección (en orden de documento) dentro de la
          // banda. El hero ("top") entra en la lista, así que arriba del todo
          // "Inicio" queda activo.
          const first = SECTIONS.find((s) => visible.has(s.id));
          if (first) setActive(first.id);
        },
        // Banda de detección: desde justo debajo del bloque fijo hasta el 45%
        // del viewport, para que solo una sección "mande" a la vez.
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

  return (
    <nav
      aria-label="Secciones de la página"
      className="border-t border-b border-hairline bg-white"
    >
      {/* Compacta y sin scroll horizontal: en móvil las 5 entradas se reparten
          el ancho (justify-between) con etiquetas cortas, así todas —incluida
          "Comenzar"— quedan visibles a la vez. En escritorio se centran con
          las etiquetas completas. */}
      <ul className="mx-auto flex max-w-[1200px] items-center justify-between gap-1 px-3 py-1.5 text-[11px] tracking-tight md:justify-center md:gap-6 md:px-6 md:py-2 md:text-[13px]">
        {SECTIONS.map((s) => {
          const isActive = active === s.id;
          const isCta = s.id === CTA_ID;
          // "Comenzar" siempre destacado; el resto solo al estar su sección
          // activa. Su estado activo se refuerza al oscurecer el subrayado.
          const highlighted = isActive || isCta;
          return (
            <li key={s.id} className="min-w-0">
              <a
                href={`#${s.id}`}
                aria-current={isActive ? "true" : undefined}
                className={`inline-block rounded-field px-1 py-0.5 whitespace-nowrap outline-none transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-black/40 md:px-1.5 ${
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
                {/* Etiqueta corta en móvil, completa en escritorio. Solo una se
                    muestra (display) en cada breakpoint, así el lector de
                    pantalla lee únicamente la visible. */}
                <span className="md:hidden">{s.short}</span>
                <span className="hidden md:inline">{s.label}</span>
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
