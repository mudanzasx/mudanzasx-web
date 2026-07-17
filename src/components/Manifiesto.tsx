// Banda de manifiesto: interrupción deliberada en negro dentro de la zebra
// gris/blanca de la landing (rompe el ritmo para dar énfasis). Detrás del texto,
// ondas concéntricas de marca (OndasConcentricas) ancladas al borde derecho.

import OndasConcentricas from "./OndasConcentricas";

export default function Manifiesto() {
  return (
    <section className="relative w-full overflow-hidden bg-black">
      {/* Ondas blancas sobre negro, opacidad ~18% → 2%. */}
      <OndasConcentricas
        viewBox="0 0 1200 500"
        preserveAspectRatio="xMaxYMid slice"
        originX={1200}
        originY={250}
        baseRadius={95}
        stroke="#ffffff"
        opacityStart={0.18}
      />

      {/* Texto alineado a la izquierda: coherente con los titulares de la web
          (hero y secciones van a la izquierda) y, además, queda sobre la zona
          izquierda donde los arcos son más tenues y espaciados, así el titular
          se lee perfectamente. */}
      <div className="relative z-10 mx-auto max-w-[1200px] px-6 py-16 md:py-28">
        <h2 className="max-w-3xl text-[clamp(2rem,4.5vw,3rem)] font-medium leading-tight tracking-[-0.02em] text-white">
          Cada mudanza se calcula.
        </h2>
      </div>
    </section>
  );
}
