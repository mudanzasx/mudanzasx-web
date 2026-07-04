import Image from "next/image";

// Imagen destacada de sección: patrón único y reutilizable para las tres
// secciones (Cómo funciona, FAQs, Servicios).
//
// Las WebP ya traen su propio fondo gris de marca (#F3F3F3) integrado, con el
// sujeto centrado y margen uniforme. Por eso el contenedor NO añade otro fondo
// ni padding (evita el doble marco/gris): solo aplica esquinas redondeadas a la
// propia imagen y unifica el ancho.
// - Mismo ancho máximo (420px), centrado; en móvil ocupa el ancho disponible.
// - La imagen rellena el ancho sin deformar; el alto sigue su proporción real
//   (width/height evitan el layout shift).
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
    <div className="mx-auto mt-8 w-full max-w-[420px] md:mt-10">
      <Image
        src={src}
        alt={alt}
        width={width}
        height={height}
        sizes="(min-width: 468px) 420px, calc(100vw - 48px)"
        loading="lazy"
        className="h-auto w-full rounded-2xl"
      />
    </div>
  );
}
