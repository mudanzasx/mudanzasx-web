import SectionImage from "./SectionImage";
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
  {
    Icon: IconDocument,
    nombre: "Presupuesto sin compromiso",
    desc: "Te damos un precio cerrado y claro antes de que decidas nada.",
  },
  {
    Icon: IconCalendar,
    nombre: "Planificación",
    desc: "Organizamos fecha, equipo y ruta para que todo salga a tiempo.",
  },
  {
    Icon: IconBuilding,
    nombre: "Gestión de permisos municipales",
    desc: "Tramitamos los permisos de estacionamiento donde hagan falta.",
  },
  {
    Icon: IconTools,
    nombre: "Montaje y desmontaje",
    desc: "Desmontamos en origen y volvemos a montar tus muebles en destino.",
  },
  {
    Icon: IconBox,
    nombre: "Protección y embalaje",
    desc: "Envolvemos y protegemos cada objeto con material profesional.",
  },
  {
    Icon: IconLoad,
    nombre: "Carga y descarga",
    desc: "Movemos todo con cuidado, también los objetos pesados o delicados.",
  },
  {
    Icon: IconTruck,
    nombre: "Transporte",
    desc: "Vehículos propios para llevar tu mudanza a cualquier punto de la península.",
  },
  {
    Icon: IconRecycle,
    nombre: "Retirada a punto limpio",
    desc: "Nos llevamos lo que ya no quieras y lo gestionamos por ti.",
  },
];

export default function Servicios() {
  return (
    <section id="servicios" className="w-full border-t border-black/10">
      <div className="mx-auto max-w-[1200px] px-6 py-14 md:py-24">
        <h2 className="text-[clamp(1.75rem,3.5vw,2.5rem)] font-medium leading-tight tracking-[-0.02em] text-black">
          Servicios
        </h2>

        {/* Imagen destacada (recortada sin fondo) sobre contenedor gris de marca. */}
        <SectionImage
          src="/servicios-vivienda.webp"
          alt="Vivienda moderna representando los servicios de mudanzas de Mudanzas X en Barcelona"
          width={900}
          height={719}
        />

        <div className="mt-12 grid grid-cols-1 gap-x-12 gap-y-9 sm:grid-cols-2 md:mt-16 md:gap-y-11">
          {SERVICIOS.map(({ Icon, nombre, desc }) => (
            <div key={nombre} className="flex gap-4">
              <Icon size={28} className="mt-0.5 shrink-0 text-black" />
              <div className="min-w-0">
                <h3 className="text-base font-medium leading-snug tracking-tight text-black">
                  {nombre}
                </h3>
                <p className="mt-1.5 text-sm leading-[1.6] text-black/60">
                  {desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
