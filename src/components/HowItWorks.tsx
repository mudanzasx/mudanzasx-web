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

        {/* Escritorio (lg+): dos columnas — los tres pasos a la IZQUIERDA (uno
            debajo de otro) y la imagen a la DERECHA, ópticamente centrados entre
            sí (items-center). MISMA estructura, reparto (imagen 720px · lista
            mín. 300px) y espaciado que "Mudanza de vivienda". La imagen va
            primera en el DOM (lg:order-2 la lleva a la derecha) para que, al
            apilarse por debajo de lg, quede arriba y los pasos debajo. */}
        <div className="mt-10 grid grid-cols-1 items-center gap-10 md:mt-12 lg:grid-cols-[minmax(300px,1fr)_minmax(0,720px)] lg:gap-16">
          {/* Imagen destacada: misma serie de estudio (fondo negro) y mismo
              tratamiento de caja 16:9 que las de "Mudanza de vivienda". */}
          <div className="lg:order-2">
            <SectionImage
              src="/comofunciona.webp"
              alt="La web de Mudanzas X en el móvil para pedir presupuesto de mudanza en Barcelona"
            />
          </div>

          {/* Pasos del proceso (componente compartido con la confirmación). En la
              landing son una promesa: los tres sin nada completado. Se acotan
              (max-w-md) para una longitud de línea cómoda cuando se apilan bajo
              la imagen ancha; en dos columnas llenan su columna. */}
          <div className="w-full max-w-md lg:order-1">
            <PasosProceso />
          </div>
        </div>
      </div>
    </section>
  );
}
