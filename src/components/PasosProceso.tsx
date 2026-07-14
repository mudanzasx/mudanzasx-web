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

export default function PasosProceso({ completado }: { completado?: string }) {
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
        // El paso previo hecho lleva el número 0 (no un icono, para no duplicar
        // el check del título/badge); los tres pasos siguientes son 1·2·3.
        const numero = completado ? i : i + 1;
        // Solo el paso 0 (contacto ya hecho, en la confirmación) se ve
        // completado: círculo negro sólido con el "0" en blanco. Los pendientes
        // (1·2·3) llevan el círculo gris con número negro. En la landing no hay
        // paso 0, así que todos quedan pendientes.
        const hecho = Boolean(completado) && i === 0;
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
            <div
              className={`relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-pill ${
                hecho ? "bg-black text-white" : "bg-gris text-black"
              }`}
            >
              <span className="text-base font-semibold tabular-nums">
                {numero}
              </span>
            </div>
            <div className="min-w-0 pt-1.5">
              <h3 className="text-[clamp(1rem,0.95rem+0.3vw,1.125rem)] font-medium tracking-tight text-black">
                {fila.titulo}
              </h3>
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
