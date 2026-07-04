import Image from "next/image";

// Imagen destacada de sección: patrón único y reutilizable para las tres
// secciones (Cómo funciona, FAQs, Servicios), de modo que los tres cuadros y las
// tres imágenes se vean EXACTAMENTE iguales en cada breakpoint.
//
// - Contenedor cuadrado (aspect-square) con fondo gris de marca (#F3F3F3),
//   esquinas redondeadas, ancho máximo contenido (420px) y centrado.
// - Padding interior uniforme (p-6) por los cuatro lados.
// - La imagen (1024x1024 cuadrada) rellena el área interior con object-contain:
//   se ve completa, sin recortar ni deformar, y al mismo tamaño visual en las tres.
export default function SectionImage({
  src,
  alt,
}: {
  src: string;
  alt: string;
}) {
  return (
    <div className="mx-auto mt-8 w-full max-w-[420px] md:mt-10">
      <div className="aspect-square w-full rounded-2xl bg-gris p-6">
        {/* Área interior (dentro del padding). La imagen la rellena por completo. */}
        <div className="relative h-full w-full">
          <Image
            src={src}
            alt={alt}
            fill
            sizes="(min-width: 468px) 372px, calc(100vw - 96px)"
            loading="lazy"
            className="object-contain"
          />
        </div>
      </div>
    </div>
  );
}
