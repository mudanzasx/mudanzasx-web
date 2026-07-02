import { formatVolumen } from "@/lib/leads";

// Vista de SOLO LECTURA del presupuesto asociado a la operación: qué hay que
// mover (inventario con sus servicios), productos vendidos y un resumen de
// volumen y accesos. Los nombres salen del propio snapshot del presupuesto
// (detalle_objetos), que es lo que se cotizó para esta mudanza.

type Interruptores = {
  desmontaje?: boolean;
  montaje?: boolean;
  film?: boolean;
  burbujas?: boolean;
  punto_limpio?: boolean;
};

type ObjetoLinea = {
  id?: string | number;
  objeto?: string;
  sala?: string | null;
  cantidad?: number;
  volumen_m3?: number;
  interruptores?: Interruptores;
};

type ProductoLinea = {
  id?: string | number;
  nombre?: string;
  cantidad?: number;
};

type Accesos = {
  origen_planta?: number;
  origen_ascensor?: boolean;
  destino_planta?: number;
  destino_ascensor?: boolean;
};

export type DetallePresupuesto = {
  objetos?: ObjetoLinea[];
  productos?: ProductoLinea[];
  accesos?: Accesos;
};

const SERVICIOS: { key: keyof Interruptores; label: string }[] = [
  { key: "desmontaje", label: "Desmontaje" },
  { key: "montaje", label: "Montaje" },
  { key: "film", label: "Film" },
  { key: "burbujas", label: "Burbujas" },
  { key: "punto_limpio", label: "Punto limpio" },
];

function planta(n: number | undefined): string {
  const v = Math.max(0, Math.floor(n ?? 0));
  return v === 0 ? "Planta baja" : `Planta ${v}`;
}

export default function ServicioInventario({
  detalle,
  volumenM3,
}: {
  detalle: DetallePresupuesto | null;
  volumenM3: number | null;
}) {
  const objetos = detalle?.objetos ?? [];
  const productos = detalle?.productos ?? [];
  const accesos = detalle?.accesos ?? null;

  return (
    <section className="rounded-lg border border-black/10 p-5">
      <h2 className="mb-4 text-xs font-medium uppercase tracking-wide text-black/50">
        Servicio e inventario
      </h2>

      {!detalle ? (
        <p className="text-sm text-black/50">Sin presupuesto asociado.</p>
      ) : (
        <div className="flex flex-col gap-6">
          {/* Resumen para el equipo */}
          <div className="grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-3">
            <Resumen label="Volumen" valor={formatVolumen(volumenM3)} />
            <Resumen
              label="Origen"
              valor={
                accesos
                  ? `${planta(accesos.origen_planta)} · ${
                      accesos.origen_ascensor ? "con ascensor" : "sin ascensor"
                    }`
                  : "—"
              }
            />
            <Resumen
              label="Destino"
              valor={
                accesos
                  ? `${planta(accesos.destino_planta)} · ${
                      accesos.destino_ascensor ? "con ascensor" : "sin ascensor"
                    }`
                  : "—"
              }
            />
          </div>

          {/* Inventario */}
          <div>
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-black/40">
              Inventario
            </p>
            {objetos.length === 0 ? (
              <p className="text-sm text-black/50">Sin objetos en el inventario.</p>
            ) : (
              <ul className="flex flex-col divide-y divide-black/5">
                {objetos.map((o, i) => {
                  const servicios = SERVICIOS.filter(
                    (s) => o.interruptores?.[s.key]
                  );
                  return (
                    <li
                      key={o.id ?? i}
                      className="flex flex-col gap-1.5 py-2.5 sm:flex-row sm:items-start sm:justify-between sm:gap-4"
                    >
                      <span className="text-sm text-black">
                        <span className="font-medium tabular-nums">
                          {o.cantidad ?? 1}×
                        </span>{" "}
                        {o.objeto ?? "Objeto"}
                        {o.sala ? (
                          <span className="text-black/40"> · {o.sala}</span>
                        ) : null}
                      </span>
                      {servicios.length > 0 && (
                        <span className="flex flex-wrap gap-1.5">
                          {servicios.map((s) => (
                            <span
                              key={s.key}
                              className="whitespace-nowrap rounded-full bg-gris px-2 py-0.5 text-[11px] font-medium text-black/70"
                            >
                              {s.label}
                            </span>
                          ))}
                        </span>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          {/* Productos vendidos (si los hay) */}
          {productos.length > 0 && (
            <div>
              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-black/40">
                Productos
              </p>
              <ul className="flex flex-col divide-y divide-black/5">
                {productos.map((p, i) => (
                  <li key={p.id ?? i} className="py-2.5 text-sm text-black">
                    <span className="font-medium tabular-nums">
                      {p.cantidad ?? 1}×
                    </span>{" "}
                    {p.nombre ?? "Producto"}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </section>
  );
}

function Resumen({ label, valor }: { label: string; valor: string }) {
  return (
    <div>
      <p className="text-[11px] uppercase tracking-wide text-black/40">{label}</p>
      <p className="mt-0.5 text-sm font-medium text-black">{valor}</p>
    </div>
  );
}
