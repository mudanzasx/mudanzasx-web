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

        <div className="relative mt-16">
          {/* Línea de progresión (escritorio): une el centro de los 4 nodos. */}
          <div
            aria-hidden
            className="absolute top-7 left-[12.5%] right-[12.5%] hidden h-px bg-black/15 md:block"
          />

          <div className="grid grid-cols-1 gap-y-14 md:grid-cols-4 md:gap-x-8">
            {PASOS.map((paso, i) => {
              const Icon = paso.Icon;
              return (
                <div
                  key={paso.titulo}
                  className="flex flex-col md:items-center md:text-center"
                >
                  <div className="relative z-10 flex h-14 w-14 items-center justify-center rounded-full border border-black/15 bg-gris text-black md:mx-auto">
                    <Icon size={26} />
                  </div>
                  <span className="mt-5 inline-block text-sm font-medium tabular-nums tracking-[0.15em] text-black/40">
                    0{i + 1}
                  </span>
                  <h3 className="mt-1 text-lg font-medium tracking-tight text-black">
                    {paso.titulo}
                  </h3>
                  <p className="mt-2 text-[15px] leading-[1.6] text-black/70 md:max-w-[220px]">
                    {paso.texto}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
