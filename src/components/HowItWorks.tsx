import SectionImage from "./SectionImage";
import PasosProceso from "./PasosProceso";

export default function HowItWorks() {
  return (
    <section id="como-funciona" className="w-full border-t border-hairline bg-white">
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

            {/* Pasos del proceso (componente compartido con la confirmación).
                En la landing son una promesa: los tres sin nada completado. */}
            <div className="mt-10 md:mt-12">
              <PasosProceso />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
