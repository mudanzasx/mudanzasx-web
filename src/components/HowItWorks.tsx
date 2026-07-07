import SectionImage from "./SectionImage";

const PASOS = [
  { titulo: "Conectar" },
  { titulo: "Presupuesto cerrado" },
  { titulo: "Reserva" },
  { titulo: "Nueva vida" },
];

export default function HowItWorks() {
  return (
    <section id="como-funciona" className="w-full border-t border-black/10">
      <div className="mx-auto max-w-[1200px] px-6 py-14 md:py-24">
        {/* Escritorio: dos columnas (imagen a la izquierda, contenido a la
            derecha), alineadas verticalmente al centro. Móvil: se apilan con la
            imagen arriba y el contenido debajo. */}
        <div className="grid grid-cols-1 items-center gap-10 md:grid-cols-2 md:gap-12 lg:gap-16">
          {/* Imagen destacada (ya trae su fondo gris de marca integrado). */}
          <SectionImage
            src="/comofunciona.webp"
            alt="La web de Mudanzas X en el móvil para pedir presupuesto de mudanza en Barcelona"
            width={1024}
            height={1024}
          />

          <div>
            <h2 className="text-[clamp(1.75rem,3.5vw,2.5rem)] font-medium leading-tight tracking-[-0.02em] text-black">
              Cómo funciona
            </h2>

            {/* Pasos del proceso: secuencia encadenada con conector vertical. */}
            <ol className="mt-10 flex flex-col md:mt-12">
            {PASOS.map((paso, i) => {
              const ultimo = i === PASOS.length - 1;
              return (
                <li
                  key={paso.titulo}
                  className={`relative flex items-center gap-4 ${ultimo ? "" : "pb-6"}`}
                >
                  {/* Conector hacia el siguiente paso (une el centro de los
                      círculos, mostrando la progresión). */}
                  {!ultimo && (
                    <span
                      aria-hidden
                      className="absolute bottom-0 left-[22px] top-11 w-px -translate-x-1/2 bg-black/15"
                    />
                  )}
                  <div className="relative z-10 flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gris text-black">
                    <span className="text-base font-semibold tabular-nums">
                      {i + 1}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-lg font-medium tracking-tight text-black">
                      {paso.titulo}
                    </h3>
                  </div>
                </li>
              );
            })}
            </ol>
          </div>
        </div>
      </div>
    </section>
  );
}
