import Image from "next/image";

// Imagen destacada de sección (hoy: "Cómo funciona").
//
// Las WebP son parte de una misma serie fotográfica: estudio monocromo, fondo
// negro, suelo y sombra de contacto (hermanas de las 4 de "Mudanza de vivienda").
// Por eso se presentan EXACTAMENTE igual que aquellas: caja 16:9 con esquinas
// redondeadas (--radius-card), borde hairline y sombra de tarjeta. La imagen
// trae su fondo integrado, así que el contenedor NO añade padding ni marco extra
// (nada de doble cuadro); el fill + object-cover la encaja sin deformar.
//
// La sección decide su lado y alineación mediante el grid; el componente solo se
// ocupa de la imagen (proporción fija 16:9 → sin layout shift, ancho contenido).
// Ancho máximo 720px: el MISMO que la zona de imagen de "Mudanza de vivienda",
// para que las cinco fotos de la serie se muestren al mismo tamaño en escritorio.
export default function SectionImage({
  src,
  alt,
}: {
  src: string;
  alt: string;
}) {
  return (
    <div className="mx-auto w-full max-w-[720px]">
      {/* Mismo tratamiento que las imágenes de "Mudanza de vivienda": aspect-ratio
          fija la altura (sin CLS) y coincide con la 16:9 real de la imagen, así
          object-cover muestra el teléfono completo y centrado en cualquier ancho
          (no recorta por los lados). bg-gris solo como respaldo mientras carga. */}
      <div className="relative aspect-[16/9] w-full overflow-hidden rounded-card border border-hairline bg-gris shadow-card">
        <Image
          src={src}
          alt={alt}
          fill
          sizes="(min-width: 768px) 720px, calc(100vw - 48px)"
          loading="lazy"
          className="object-cover object-center"
        />
      </div>
    </div>
  );
}
