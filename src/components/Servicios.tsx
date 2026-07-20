"use client";

import Image from "next/image";
import { useState } from "react";
import { Truck, Wrench, Landmark, Recycle, Check, type LucideIcon } from "lucide-react";

// Único servicio de la empresa (mudanza de vivienda) desglosado en sus 4 partes.
// Cada una tiene su icono (lucide-react), su nombre y la imagen (16:9, estudio
// monocromo) que se muestra arriba al seleccionarla.
type Servicio = {
  id: string;
  nombre: string;
  Icon: LucideIcon;
  img: string; // ruta de la imagen (16:9, 1376x768)
  alt: string;
};

const SERVICIOS: Servicio[] = [
  {
    id: "montaje",
    nombre: "Montaje, desmontaje y protección",
    Icon: Wrench,
    img: "/servicio-montaje.webp",
    alt: "Armario listo para montaje y desmontaje en una mudanza de Mudanzas X",
  },
  {
    id: "transporte",
    nombre: "Transporte, carga y descarga",
    Icon: Truck,
    img: "/servicio-transporte.webp",
    alt: "Camión de mudanzas de Mudanzas X preparado para carga y transporte",
  },
  {
    id: "permisos",
    nombre: "Gestión de permisos municipales",
    Icon: Landmark,
    img: "/servicio-permisos.webp",
    alt: "Señalización de reserva de estacionamiento para una mudanza de Mudanzas X",
  },
  {
    id: "retirada",
    nombre: "Retirada a punto limpio",
    Icon: Recycle,
    img: "/servicio-retirada.webp",
    alt: "Cajas preparadas para retirada a punto limpio por Mudanzas X",
  },
];

export default function Servicios() {
  // Selección del servicio. Nada rota solo: lo controla el usuario.
  //  · `fijado` es la selección FIJADA (por clic o teclado); persiste.
  //  · `preview` es la previsualización por HOVER en escritorio; al salir con el
  //    ratón vuelve a la fijada.
  // El servicio mostrado es la previsualización si la hay, si no la fijada (M9).
  const [fijado, setFijado] = useState(0);
  const [preview, setPreview] = useState<number | null>(null);
  const activo = preview ?? fijado;

  return (
    <section id="servicios" className="w-full border-t border-hairline bg-gris">
      <div className="mx-auto max-w-[1200px] px-6 py-14 md:py-24">
        {/* Titular arriba, a ancho completo — misma composición que "Cómo
            funciona". */}
        <h2 className="text-[clamp(1.75rem,3.5vw,2.5rem)] font-medium leading-tight tracking-[-0.02em] text-black">
          Mudanza de vivienda
        </h2>

        {/* Escritorio (lg+): dos columnas — los 4 servicios a la IZQUIERDA (uno
            debajo de otro) y la imagen a la DERECHA, ópticamente centrados entre
            sí (items-center). Mismo reparto (imagen 720px · lista mín. 300px) y
            mismos anchos que "Cómo funciona". La imagen va primera en el DOM
            (lg:order-2 la lleva a la derecha) para que, al apilarse por debajo de
            lg, quede arriba y los servicios debajo. */}
        <div className="mt-10 grid grid-cols-1 items-center gap-10 md:mt-12 lg:grid-cols-[minmax(300px,1fr)_minmax(0,720px)] lg:gap-16">
          {/* Zona de imagen (16:9): las 4 capas se apilan y solo la activa está
              a opacidad 1 (crossfade discreto). aspect-ratio fija la altura para
              no provocar CLS. Máx. 720px (mismo tamaño que "Cómo funciona"). */}
          <div className="relative mx-auto aspect-[16/9] w-full max-w-[720px] overflow-hidden rounded-card border border-hairline bg-gris shadow-card lg:order-2">
            {SERVICIOS.map((s, i) => (
              <div
                key={s.id}
                aria-hidden={activo !== i}
                className={`absolute inset-0 bg-gris transition-opacity duration-200 ease-out motion-reduce:transition-none ${
                  activo === i ? "opacity-100" : "opacity-0"
                }`}
              >
                <Image
                  src={s.img}
                  alt={s.alt}
                  fill
                  loading="lazy"
                  sizes="(min-width: 768px) 720px, calc(100vw - 48px)"
                  className="object-cover"
                />
              </div>
            ))}
          </div>

          {/* Los 4 servicios como botones reales, en una única columna vertical.
              En escritorio: el CLIC (o teclado: Tab + Enter/Espacio) FIJA el
              servicio; el hover solo lo PREVISUALIZA y, al salir el ratón de la
              lista, vuelve al fijado. En móvil el tap fija (sin hover).
              aria-pressed comunica el fijado. */}
          <div
            className="flex flex-col gap-3 sm:gap-4 lg:order-1"
            onMouseLeave={() => setPreview(null)}
          >
            {SERVICIOS.map((s, i) => {
              const on = activo === i;
              return (
                <button
                  key={s.id}
                  type="button"
                  aria-pressed={fijado === i}
                  onMouseEnter={() => setPreview(i)}
                  onFocus={() => setFijado(i)}
                  onClick={() => {
                    setFijado(i);
                    setPreview(null);
                  }}
                  className={`flex min-h-[52px] items-center gap-3.5 rounded-card border border-hairline px-4 py-3.5 text-left shadow-card outline-none transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-black/40 ${
                    on ? "bg-black text-white" : "bg-white text-black hover:bg-black/[0.03]"
                  }`}
                >
                  <s.Icon size={24} strokeWidth={1.5} className="shrink-0" />
                  <span className="text-small font-medium leading-snug tracking-tight">
                    {s.nombre}
                  </span>
                  {/* Marca de estado "activo": se AÑADE al icono del servicio
                      (que sigue identificándolo). Monocromo estricto: hereda el
                      color del botón (blanco sobre el activo en negro). Aparece
                      con la misma transición breve que el crossfade de la imagen
                      y respeta prefers-reduced-motion. */}
                  <Check
                    size={18}
                    strokeWidth={1.5}
                    aria-hidden
                    className={`ml-auto shrink-0 transition-opacity duration-200 ease-out motion-reduce:transition-none ${
                      on ? "opacity-100" : "opacity-0"
                    }`}
                  />
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
