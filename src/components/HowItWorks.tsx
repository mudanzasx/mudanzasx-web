import SectionImage from "./SectionImage";
import PasosProceso from "./PasosProceso";

export default function HowItWorks() {
  return (
    <section id="como-funciona" className="w-full border-t border-hairline bg-white">
      <div className="mx-auto max-w-[1200px] px-6 py-14 md:py-24">
        {/* Titular arriba, a ancho completo — mismo patrón de composición que
            "Mudanza de vivienda" (titular · imagen · elementos debajo/al lado). */}
        <h2 className="text-[clamp(1.75rem,3.5vw,2.5rem)] font-medium leading-tight tracking-[-0.02em] text-black">
          Cómo funciona
        </h2>

        {/* Escritorio (lg+): dos columnas — la imagen al MISMO tamaño (720px) que
            la de servicios y los tres pasos ópticamente centrados a su lado
            (items-center). La columna de imagen se limita a 720px y la de pasos
            toma el resto (mín. 300px). Por debajo de lg se apila: imagen arriba
            (720px, centrada) y los pasos debajo, como en móvil. */}
        <div className="mt-10 grid grid-cols-1 items-center gap-10 md:mt-12 lg:grid-cols-[minmax(0,720px)_minmax(300px,1fr)] lg:gap-16">
          {/* Imagen destacada: misma serie de estudio (fondo negro) y mismo
              tratamiento de caja 16:9 que las de "Mudanza de vivienda". */}
          <SectionImage
            src="/comofunciona.webp"
            alt="La web de Mudanzas X en el móvil para pedir presupuesto de mudanza en Barcelona"
          />

          {/* Pasos del proceso (componente compartido con la confirmación). En la
              landing son una promesa: los tres sin nada completado. Se acotan
              (max-w-md) para una longitud de línea cómoda cuando se apilan bajo
              la imagen ancha; en dos columnas llenan su columna. */}
          <div className="w-full max-w-md">
            <PasosProceso />
          </div>
        </div>
      </div>
    </section>
  );
}
