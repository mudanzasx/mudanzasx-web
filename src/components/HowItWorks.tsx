import Image from "next/image";
import { IconRoute, IconData, IconLock, IconTruck } from "./SystemIcons";

const PASOS = [
  {
    Icon: IconRoute,
    titulo: "Cuéntanos tu mudanza",
    texto: "Origen, destino y qué mueves. Un minuto.",
  },
  {
    Icon: IconData,
    titulo: "Recibe tu precio real",
    texto: "Calculado con volumen, distancia y equipo. Sin estimaciones a ojo.",
  },
  {
    Icon: IconLock,
    titulo: "Reserva con el 50%",
    texto: "Bloqueas fecha y equipo. Paga el 100% y ahorra un 5%.",
  },
  {
    Icon: IconTruck,
    titulo: "Nosotros ejecutamos",
    texto: "Embalaje, carga, transporte y descarga. Tú no cargas nada.",
  },
];

export default function HowItWorks() {
  return (
    <section id="como-funciona" className="w-full border-t border-black/10">
      <div className="mx-auto max-w-[1200px] px-6 py-14 md:py-24">
        <h2 className="text-[clamp(1.75rem,3.5vw,2.5rem)] font-medium leading-tight tracking-[-0.02em] text-black">
          Cómo funciona
        </h2>

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

          {/* Pasos del proceso (lista vertical). */}
          <ol className="flex flex-col gap-8">
            {PASOS.map((paso, i) => {
              const Icon = paso.Icon;
              return (
                <li key={paso.titulo} className="flex gap-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-black/15 bg-gris text-black">
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
