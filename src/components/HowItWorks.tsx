import Image from "next/image";
import { IconRoute, IconData, IconLock, IconTruck } from "./SystemIcons";

const PASOS = [
  {
    Icon: IconRoute,
    titulo: "Conectar",
    texto:
      "Nos dices desde dónde y hasta dónde. Te llamamos para conocer los detalles de tu mudanza.",
  },
  {
    Icon: IconData,
    titulo: "Presupuesto cerrado",
    texto: "Con tu inventario y accesos, cerramos un precio claro, sin sorpresas.",
  },
  {
    Icon: IconLock,
    titulo: "Reserva",
    texto:
      "Reservas tu fecha con el 50%, o el total con un 5% de descuento. Pago seguro.",
  },
  {
    Icon: IconTruck,
    titulo: "Nueva vida",
    texto:
      "Nos encargamos de todo el día de la mudanza. Tú solo empiezas tu nueva vida.",
  },
];

export default function HowItWorks() {
  return (
    <section id="como-funciona" className="w-full border-t border-black/10">
      <div className="mx-auto max-w-[1200px] px-6 py-14 md:py-24">
        <div className="flex flex-wrap items-baseline gap-x-4 gap-y-2">
          <h2 className="text-[clamp(1.75rem,3.5vw,2.5rem)] font-medium leading-tight tracking-[-0.02em] text-black">
            Cómo funciona
          </h2>
          <span className="text-xs font-medium uppercase tabular-nums tracking-[0.15em] text-black/40">
            4 pasos · 01–04
          </span>
        </div>

        <div className="mt-12 grid grid-cols-1 items-center gap-10 md:mt-16 md:grid-cols-2 md:gap-16">
          {/* Imagen: pídelo desde el móvil. */}
          <div className="relative aspect-square w-full overflow-hidden rounded-2xl">
            <Image
              src="/app-movil-presupuesto.jpg"
              alt="Persona pidiendo un presupuesto de mudanza desde la app de Mudanzas X en el móvil"
              fill
              sizes="(min-width: 768px) 560px, 100vw"
              quality={90}
              loading="lazy"
              className="object-cover"
            />
          </div>

          {/* Pasos del proceso: secuencia encadenada con conector vertical. */}
          <ol className="flex flex-col">
            {PASOS.map((paso, i) => {
              const Icon = paso.Icon;
              const ultimo = i === PASOS.length - 1;
              return (
                <li
                  key={paso.titulo}
                  className={`relative flex gap-4 ${ultimo ? "" : "pb-8"}`}
                >
                  {/* Conector hacia el siguiente paso (une el centro de los
                      círculos, mostrando la progresión). */}
                  {!ultimo && (
                    <span
                      aria-hidden
                      className="absolute bottom-0 left-[22px] top-11 w-px -translate-x-1/2 bg-black/15"
                    />
                  )}
                  <div className="relative z-10 flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-black/15 bg-gris text-black">
                    <Icon size={22} />
                  </div>
                  <div className="min-w-0">
                    <span className="text-xs font-medium tabular-nums tracking-[0.15em] text-black/40">
                      0{i + 1}
                    </span>
                    <h3 className="mt-0.5 text-lg font-medium tracking-tight text-black">
                      {paso.titulo}
                    </h3>
                    <p className="mt-1 text-[15px] leading-[1.6] text-black/70">
                      {paso.texto}
                    </p>
                  </div>
                </li>
              );
            })}
          </ol>
        </div>
      </div>
    </section>
  );
}
