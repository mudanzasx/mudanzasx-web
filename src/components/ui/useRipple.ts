import {
  useCallback,
  useRef,
  type PointerEvent as ReactPointerEvent,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";

// Ripple de marca al pulsar un botón primario (negro): nace una onda blanca
// semitransparente en el punto exacto de la pulsación y se expande hasta cubrir
// el botón, desvaneciéndose. Es coherente con las ondas concéntricas de la marca
// (hero, manifiesto, pulse ring del botón Llamar).
//
// - Solo anima transform (scale) y opacity, nunca width/height (ver .mx-ripple
//   en globals.css).
// - Va POR DEBAJO del texto (z-index negativo dentro del stacking del propio
//   botón) y con pointer-events:none, así el texto siempre se lee y la onda no
//   añade fricción ni retrasa la acción.
// - Se autolimpia al terminar la animación (animationend → remove): no acumula
//   nodos en el DOM.
// - Respeta prefers-reduced-motion: no crea onda.
// - Funciona con clic, toque (pointerdown cubre ambos) y teclado (Enter/Espacio,
//   con la onda naciendo en el centro).
//
// El botón debe llevar `relative isolate overflow-hidden`: relative/isolate para
// crear el contexto de apilamiento que contiene la onda por debajo del texto, y
// overflow-hidden para recortarla contra el radio de la píldora.
export function useRipple<T extends HTMLElement = HTMLButtonElement>() {
  const ref = useRef<T | null>(null);

  const spawn = useCallback((x: number, y: number) => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const { width, height } = el.getBoundingClientRect();
    // Radio que garantiza cubrir el botón: distancia al vértice más lejano del
    // punto de pulsación.
    const radius = Math.hypot(Math.max(x, width - x), Math.max(y, height - y));
    const diameter = radius * 2;

    const span = document.createElement("span");
    span.className = "mx-ripple";
    span.style.width = `${diameter}px`;
    span.style.height = `${diameter}px`;
    span.style.left = `${x - radius}px`;
    span.style.top = `${y - radius}px`;
    span.addEventListener("animationend", () => span.remove(), { once: true });
    el.appendChild(span);
  }, []);

  const onPointerDown = useCallback(
    (e: ReactPointerEvent<T>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      spawn(e.clientX - rect.left, e.clientY - rect.top);
    },
    [spawn],
  );

  const onKeyDown = useCallback(
    (e: ReactKeyboardEvent<T>) => {
      // Enter/Espacio activan el botón: la onda nace en el centro. e.repeat evita
      // ráfagas si la tecla se mantiene pulsada.
      if (e.repeat) return;
      if (e.key === "Enter" || e.key === " " || e.key === "Spacebar") {
        const { width, height } = e.currentTarget.getBoundingClientRect();
        spawn(width / 2, height / 2);
      }
    },
    [spawn],
  );

  return { ref, onPointerDown, onKeyDown };
}
