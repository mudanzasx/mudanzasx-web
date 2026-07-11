"use client";

import Image from "next/image";
import { useState } from "react";
import { Truck, Wrench, Landmark, Recycle, type LucideIcon } from "lucide-react";

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
  // Servicio activo (el primero por defecto): nada rota solo, lo controla el
  // usuario con hover, clic o teclado.
  const [activo, setActivo] = useState(0);

  return (
    <section id="servicios" className="w-full border-t border-hairline bg-gris">
      <div className="mx-auto max-w-[1200px] px-6 py-14 md:py-24">
        <div className="mx-auto max-w-[960px]">
          <h2 className="text-[clamp(1.75rem,3.5vw,2.5rem)] font-medium leading-tight tracking-[-0.02em] text-black">
            Mudanza de vivienda
          </h2>

          {/* Zona de imagen (16:9): las 4 capas se apilan y solo la activa está
              a opacidad 1 (crossfade discreto). aspect-ratio fija la altura para
              no provocar CLS. */}
          <div className="relative mt-10 aspect-[16/9] w-full overflow-hidden rounded-card border border-hairline bg-gris shadow-card md:mt-12">
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
                  sizes="(min-width: 1008px) 960px, calc(100vw - 48px)"
                  className="object-cover"
                />
              </div>
            ))}
          </div>

          {/* Los 4 servicios como botones reales: hover, clic y teclado (Tab +
              Enter/Espacio) cambian el activo. aria-pressed comunica cuál lo
              está. Móvil: apilados. Escritorio: dos columnas de dos. */}
          <div className="mt-3 grid grid-cols-1 gap-3 sm:mt-4 sm:grid-cols-2 sm:gap-4">
            {SERVICIOS.map((s, i) => {
              const on = activo === i;
              return (
                <button
                  key={s.id}
                  type="button"
                  aria-pressed={on}
                  onMouseEnter={() => setActivo(i)}
                  onFocus={() => setActivo(i)}
                  onClick={() => setActivo(i)}
                  className={`flex min-h-[52px] items-center gap-3.5 rounded-card border border-hairline px-4 py-3.5 text-left shadow-card outline-none transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-black/40 ${
                    on ? "bg-black text-white" : "bg-white text-black hover:bg-black/[0.03]"
                  }`}
                >
                  <s.Icon size={24} strokeWidth={1.5} className="shrink-0" />
                  <span className="text-sm font-medium leading-snug tracking-tight">
                    {s.nombre}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
