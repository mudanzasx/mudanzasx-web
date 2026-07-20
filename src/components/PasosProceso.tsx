import { Check } from "lucide-react";

// Los tres pasos del proceso, los que vienen DESPUÉS de contactar (en la landing
// el contacto lo resuelve el propio formulario, por eso no es un paso). Se
// definen una sola vez y se comparten en dos sitios:
//   · "Cómo funciona" (landing): promesa del proceso, sin nada completado.
//   · "¿Qué pasa ahora?" (confirmación): hoja de ruta del cliente, con el
//     contacto ya hecho como paso previo (número 0) mediante la prop `completado`.
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

// `tituloAs` fija el nivel del encabezado de cada paso según el contexto, para
// no romper la jerarquía: en "Cómo funciona" va bajo un <h2> (por eso h3), y en
// la confirmación va directo bajo el <h1> (h2, sin saltar de h1 a h3).
export default function PasosProceso({
  completado,
  tituloAs: TituloTag = "h3",
}: {
  completado?: string;
  tituloAs?: "h2" | "h3";
}) {
  // Si se pasa `completado`, se antepone el paso previo ya hecho (número 0) con
  // ese texto; los tres pasos se numeran 1·2·3 igual en ambos casos. Sin
  // `completado`, solo se ven los tres pasos numerados.
  const filas = [
    ...(completado ? [{ titulo: completado, descripcion: null }] : []),
    ...PASOS,
  ];

  return (
    // text-left explícito: el componente se alinea igual aunque el contenedor
    // esté centrado (la página de confirmación es text-center).
    <ol className="flex flex-col text-left">
      {filas.map((fila, i) => {
        const ultimo = i === filas.length - 1;
        // Los tres pasos del proceso se numeran 1·2·3 en ambos contextos. El paso
        // previo (contacto ya hecho, solo en la confirmación) no se numera: se
        // marca con un check.
        const numero = completado ? i : i + 1;
        // Solo el paso previo (contacto ya hecho, en la confirmación) se ve
        // completado: círculo negro sólido con un CHECK blanco (en vez de un "0",
        // que resultaba raro). Los pendientes (1·2·3) llevan el círculo gris con
        // número negro. En la landing no hay paso previo, así que todos van
        // numerados 1·2·3.
        const hecho = Boolean(completado) && i === 0;
        return (
          <li
            key={fila.titulo}
            className={`relative flex gap-4 ${ultimo ? "" : "pb-10"}`}
          >
            {/* Conector vertical hacia el siguiente círculo (progresión). El
                offset horizontal (left-6 = 24px) coincide con el centro del
                círculo (h-12/w-12 = 48px) y top-12 arranca justo bajo él. */}
            {!ultimo && (
              <span
                aria-hidden
                className="absolute bottom-0 left-6 top-12 w-px -translate-x-1/2 bg-black/15"
              />
            )}
            <div
              className={`relative z-10 flex h-12 w-12 shrink-0 items-center justify-center rounded-pill ${
                hecho ? "bg-black text-white" : "bg-gris text-black"
              }`}
            >
              {hecho ? (
                <Check size={22} strokeWidth={2.5} aria-hidden />
              ) : (
                <span className="text-lg font-semibold tabular-nums">
                  {numero}
                </span>
              )}
            </div>
            <div className="min-w-0 pt-2">
              <TituloTag className="text-[clamp(1rem,0.95rem+0.3vw,1.125rem)] font-medium tracking-tight text-black">
                {fila.titulo}
              </TituloTag>
              {fila.descripcion && (
                <p className="mt-1 text-body leading-[1.5] text-black/60">
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
