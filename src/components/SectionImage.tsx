import Image from "next/image";

// Imagen destacada de sección: patrón único y reutilizable para las tres
// secciones (Cómo funciona, FAQs, Servicios).
//
// Las WebP ya traen su propio fondo gris de marca (#F3F3F3) integrado, con el
// sujeto centrado y margen uniforme. Por eso el contenedor NO añade otro fondo
// ni padding (evita el doble marco/gris): solo aplica esquinas redondeadas a la
// propia imagen y unifica el ancho.
//
// Ahora vive dentro de una de las dos columnas de la sección (escritorio) o
// apilada arriba del contenido (móvil). El componente solo se ocupa de la
// imagen en sí (proporción, esquinas, tamaño contenido) y deja que la sección
// decida su lado y alineación mediante el grid.
// - Ancho contenido (máx. 440px), centrado dentro de su columna.
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
    <div className="mx-auto w-full max-w-[440px]">
      <Image
        src={src}
        alt={alt}
        width={width}
        height={height}
        sizes="(min-width: 768px) 440px, calc(100vw - 48px)"
        loading="lazy"
        className="h-auto w-full rounded-2xl"
      />
    </div>
  );
}
