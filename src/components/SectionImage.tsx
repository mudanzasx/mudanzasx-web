import Image from "next/image";

// Imagen destacada de sección: patrón único y reutilizable para las tres
// secciones (Cómo funciona, FAQs, Servicios).
//
// Las WebP están recortadas (el sujeto llena el archivo), así que cada una tiene
// su propia proporción. El marco gris NO es cuadrado: se adapta a la imagen.
// - Mismo ancho máximo (420px), centrado; en móvil ocupa el ancho disponible.
// - Fondo gris de marca (#F3F3F3), esquinas redondeadas.
// - Padding interior uniforme y reducido (p-6) idéntico en las tres.
// - La imagen rellena el ancho interior; el alto del cuadro sigue la proporción
//   real de la imagen (width/height evitan el layout shift; sin deformar).
export default function SectionImage({
  src,
  alt,
  width,
  height,
}: {
  src: string;
  alt: string;
  width: number;
  height: number;
}) {
  return (
    <div className="mx-auto mt-8 w-full max-w-[420px] rounded-2xl bg-gris p-6 md:mt-10">
      <Image
        src={src}
        alt={alt}
        width={width}
        height={height}
        sizes="(min-width: 468px) 372px, calc(100vw - 96px)"
        loading="lazy"
        className="h-auto w-full object-contain"
      />
    </div>
  );
}
