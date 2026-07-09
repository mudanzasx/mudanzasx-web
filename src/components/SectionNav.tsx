"use client";

import { useEffect, useState } from "react";

// Secciones de la landing en orden de aparición. El id coincide con el del
// <section> correspondiente ya presente en el DOM.
const SECTIONS = [
  { id: "como-funciona", label: "Cómo funciona" },
  { id: "servicios", label: "Servicios" },
  { id: "faq", label: "Preguntas" },
  { id: "presupuesto", label: "Comenzar" },
] as const;

// Última entrada: es la llamada a la acción y va siempre destacada.
const CTA_ID = "presupuesto";

export default function SectionNav() {
  // id de la sección activa; null cuando el usuario está en el hero (arriba
  // del todo, antes de la primera sección): no se resalta ninguna entrada.
  const [active, setActive] = useState<string | null>(null);

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
          // banda; si no hay ninguna (hero), no se resalta nada.
          const first = SECTIONS.find((s) => visible.has(s.id));
          setActive(first ? first.id : null);
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
      {/* En móvil el scroll horizontal queda confinado aquí (barra oculta),
          así las 4 etiquetas nunca desbordan la página. */}
      <ul className="mx-auto flex max-w-[1200px] items-center gap-5 overflow-x-auto px-6 py-2 text-xs tracking-tight [scrollbar-width:none] md:gap-7 md:py-2.5 md:text-[13px] [&::-webkit-scrollbar]:hidden">
        {SECTIONS.map((s) => {
          const isActive = active === s.id;
          const isCta = s.id === CTA_ID;
          // "Comenzar" siempre destacado; el resto solo al estar su sección
          // activa. Su estado activo se refuerza al oscurecer el subrayado.
          const highlighted = isActive || isCta;
          return (
            <li key={s.id} className="shrink-0">
              <a
                href={`#${s.id}`}
                aria-current={isActive ? "true" : undefined}
                className={`inline-block rounded-field px-1.5 py-0.5 whitespace-nowrap outline-none transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-black/40 ${
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
                {s.label}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
