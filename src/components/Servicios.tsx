import SectionImage from "./SectionImage";
import {
  IconBuilding,
  IconTools,
  IconBox,
  IconLoad,
  IconTruck,
  IconRecycle,
} from "./SystemIcons";

const SERVICIOS = [
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
        {/* Escritorio: dos columnas (imagen a la derecha, contenido a la
            izquierda) para alternar el ritmo respecto a las otras secciones.
            Móvil: se apilan con la imagen arriba y el contenido debajo (por eso
            la imagen va primera en el DOM y solo cambia de lado con `order` en
            escritorio). */}
        <div className="grid grid-cols-1 items-center gap-10 md:grid-cols-2 md:gap-12 lg:gap-16">
          {/* Imagen destacada (ya trae su fondo gris de marca integrado). */}
          <div className="md:order-2">
            <SectionImage
              src="/servicios.webp"
              alt="Servicios de mudanzas de Mudanzas X en Barcelona"
              width={1024}
              height={1024}
            />
          </div>

          <div className="md:order-1">
            <h2 className="text-[clamp(1.75rem,3.5vw,2.5rem)] font-medium leading-tight tracking-[-0.02em] text-black">
              Servicios
            </h2>

            {/* Tarjetas compactas (icono + nombre) en cuadro gris de marca con
                el mismo radio que la imagen de la sección (rounded-2xl). */}
            <div className="mt-10 grid grid-cols-2 gap-3 sm:gap-4 md:mt-12">
              {SERVICIOS.map(({ Icon, nombre }) => (
                <div
                  key={nombre}
                  className="flex h-full flex-col items-center justify-center gap-2.5 rounded-2xl bg-gris px-4 py-6 text-center"
                >
                  <Icon size={26} className="shrink-0 text-black" />
                  <h3 className="text-sm font-medium leading-snug tracking-tight text-black">
                    {nombre}
                  </h3>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
