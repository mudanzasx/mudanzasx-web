import { Check } from "lucide-react";

// Los tres pasos del proceso, los que vienen DESPUÉS de contactar (en la landing
// el contacto lo resuelve el propio formulario, por eso no es un paso). Se
// definen una sola vez y se comparten en dos sitios:
//   · "Cómo funciona" (landing): promesa del proceso, sin nada completado.
//   · "¿Qué pasa ahora?" (confirmación): hoja de ruta del cliente, con el
//     contacto ya marcado como hecho mediante la prop `completado`.
const PASOS = [
  {
    titulo: "Presupuesto",
    descripcion: "Te llamamos, conocemos tu mudanza y cerramos un precio claro.",
  },
  {
    titulo: "Reserva",
    descripcion: "Reservas tu fecha con el 50%, o el total con un 5% de descuento.",
  },
  {
    titulo: "Mudanza",
    descripcion: "Nuestro equipo se encarga de todo el día acordado.",
  },
];

export default function PasosProceso({ completado }: { completado?: string }) {
  // Si se pasa `completado`, se antepone una fila ya resuelta (check monocromo
  // negro, nunca verde) con ese texto; los tres pasos se numeran 1·2·3 igual en
  // ambos casos. Sin `completado`, solo se ven los tres pasos numerados.
  const filas = [
    ...(completado ? [{ titulo: completado, descripcion: null, hecho: true }] : []),
    ...PASOS.map((p) => ({ ...p, hecho: false })),
  ];

  return (
    // text-left explícito: el componente se alinea igual aunque el contenedor
    // esté centrado (la página de confirmación es text-center).
    <ol className="flex flex-col text-left">
      {filas.map((fila, i) => {
        const ultimo = i === filas.length - 1;
        // La fila completada no cuenta para la numeración: con `completado`
        // presente, el primer paso (i = 1) es el número 1.
        const numero = completado ? i : i + 1;
        return (
          <li
            key={fila.titulo}
            className={`relative flex gap-4 ${ultimo ? "" : "pb-8"}`}
          >
            {/* Conector vertical hacia el siguiente círculo (progresión). */}
            {!ultimo && (
              <span
                aria-hidden
                className="absolute bottom-0 left-5 top-11 w-px -translate-x-1/2 bg-black/15"
              />
            )}
            <div className="relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-pill bg-gris text-black">
              {fila.hecho ? (
                <Check size={18} strokeWidth={1.5} aria-hidden />
              ) : (
                <span className="text-base font-semibold tabular-nums">
                  {numero}
                </span>
              )}
            </div>
            <div className="min-w-0 pt-1.5">
              <h3 className="text-base font-medium tracking-tight text-black md:text-lg">
                {fila.titulo}
              </h3>
              {fila.descripcion && (
                <p className="mt-1 text-[15px] leading-[1.5] text-black/60">
                  {fila.descripcion}
                </p>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
