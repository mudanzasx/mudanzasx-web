import { ClipboardList, Calculator, CalendarCheck, Truck } from "lucide-react";

const PASOS = [
  {
    icon: ClipboardList,
    titulo: "Cuéntanos tu mudanza",
    texto: "Origen, destino y qué mueves. Un minuto.",
  },
  {
    icon: Calculator,
    titulo: "Recibe tu precio real",
    texto: "Calculado con volumen, distancia y equipo. Sin estimaciones a ojo.",
  },
  {
    icon: CalendarCheck,
    titulo: "Reserva con el 50%",
    texto: "Bloqueas fecha y equipo. Paga el 100% y ahorra un 5%.",
  },
  {
    icon: Truck,
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

        <div className="mt-12 grid grid-cols-1 gap-x-10 gap-y-12 md:grid-cols-4">
          {PASOS.map((paso, i) => {
            const Icon = paso.icon;
            return (
              <div key={paso.titulo} className="flex flex-col">
                <Icon size={40} strokeWidth={1} className="text-black" />
                <span className="mt-6 text-sm font-medium text-black/40">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <h3 className="mt-2 text-lg font-medium tracking-tight text-black">
                  {paso.titulo}
                </h3>
                <p className="mt-2 text-[15px] leading-[1.6] text-black/70">
                  {paso.texto}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
