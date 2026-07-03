import Image from "next/image";
import {
  IconDocument,
  IconCalendar,
  IconBuilding,
  IconTools,
  IconBox,
  IconLoad,
  IconTruck,
  IconRecycle,
} from "./SystemIcons";

const SERVICIOS = [
  { Icon: IconDocument, nombre: "Presupuesto sin compromiso" },
  { Icon: IconCalendar, nombre: "Planificación" },
  { Icon: IconBuilding, nombre: "Gestión de permisos municipales" },
  { Icon: IconTools, nombre: "Montaje y desmontaje" },
  { Icon: IconBox, nombre: "Protección y embalaje" },
  { Icon: IconLoad, nombre: "Carga y descarga" },
  { Icon: IconTruck, nombre: "Transporte" },
  { Icon: IconRecycle, nombre: "Retirada a punto limpio" },
];

export default function Servicios() {
  return (
    <section id="servicios" className="w-full border-t border-black/10">
      <div className="mx-auto max-w-[1200px] px-6 py-14 md:py-24">
        <h2 className="text-[clamp(1.75rem,3.5vw,2.5rem)] font-medium leading-tight tracking-[-0.02em] text-black">
          Servicios
        </h2>

        <div className="mt-12 grid grid-cols-2 gap-x-8 gap-y-12 md:grid-cols-4">
          {SERVICIOS.map(({ Icon, nombre }) => (
            <div key={nombre} className="flex flex-col">
              <Icon size={28} className="text-black" />
              <h3 className="mt-4 text-[15px] font-medium leading-[1.35] tracking-tight text-black md:text-base">
                {nombre}
              </h3>
            </div>
          ))}
        </div>

        {/* Banda editorial: camión de Mudanzas X en Barcelona al atardecer. */}
        <div className="relative mt-14 aspect-[16/9] w-full overflow-hidden rounded-2xl md:mt-20">
          <Image
            src="/camion-barcelona-mirador.jpg"
            alt="Camión de mudanzas de Mudanzas X en un mirador de Barcelona con la Sagrada Familia al atardecer"
            fill
            sizes="(max-width: 1199px) 100vw, 1152px"
            quality={90}
            loading="lazy"
            className="object-cover"
          />
        </div>
      </div>
    </section>
  );
}
