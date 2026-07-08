import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { btn } from "@/components/ui/button";
import {
  ESTADOS_OPERATIVOS,
  DIAS_SEMANA,
  construirMes,
  dotEstado,
  formatHora,
  isoLocal,
  mesAnterior,
  mesSiguiente,
  nombreMes,
} from "@/lib/operaciones";

// Operación tal como la muestra el calendario, con el nombre del cliente y el
// tipo de vehículo ya resueltos (join hecho en memoria por id).
type OperacionCalendario = {
  id: string;
  fecha: string | null;
  hora: string | null;
  estado_operativo: string | null;
  nombre: string | null;
  tipo: string | null;
};

// Fila cruda de operaciones (sin resolver relaciones).
type OperacionFila = {
  id: string;
  fecha: string | null;
  hora: string | null;
  estado_operativo: string | null;
  lead_id: string | null;
  vehiculo_id: string | null;
};

function esTexto(v: unknown): v is string {
  return typeof v === "string" && v.length > 0;
}

const MAX_POR_DIA = 3;

export default async function CalendarioPage({
  searchParams,
}: {
  searchParams: Promise<{ y?: string; m?: string }>;
}) {
  const { y, m } = await searchParams;

  const hoy = new Date();
  const hoyIso = isoLocal(hoy);

  // Mes visible: por defecto el actual. `m` es 1-12.
  const yearNum = Number(y);
  const monthNum = Number(m);
  const year = Number.isInteger(yearNum) && yearNum > 1970 ? yearNum : hoy.getFullYear();
  const month =
    Number.isInteger(monthNum) && monthNum >= 1 && monthNum <= 12
      ? monthNum
      : hoy.getMonth() + 1;

  const dias = construirMes(year, month, hoyIso);
  const rangoInicio = dias[0].iso;
  const rangoFin = dias[dias.length - 1].iso;

  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("operaciones")
    .select("id,fecha,hora,estado_operativo,lead_id,vehiculo_id")
    .gte("fecha", rangoInicio)
    .lte("fecha", rangoFin)
    .order("hora", { ascending: true, nullsFirst: true });

  // Operaciones ya reservadas pero sin fecha asignada (fecha_deseada era null):
  // no caben en la cuadrícula, así que se listan aparte para no perderlas.
  const { data: sinFechaData } = await supabase
    .from("operaciones")
    .select("id,fecha,hora,estado_operativo,lead_id,vehiculo_id")
    .is("fecha", null)
    .order("id", { ascending: true });

  const filasMes = (data ?? []) as OperacionFila[];
  const filasSinFecha = (sinFechaData ?? []) as OperacionFila[];

  // Resuelve nombres de cliente y tipos de vehículo con una sola consulta cada
  // uno (join en memoria por id, sin depender de claves foráneas en PostgREST).
  const leadIds = [
    ...new Set(
      [...filasMes, ...filasSinFecha].map((o) => o.lead_id).filter(esTexto)
    ),
  ];
  const vehiculoIds = [
    ...new Set(
      [...filasMes, ...filasSinFecha].map((o) => o.vehiculo_id).filter(esTexto)
    ),
  ];

  const nombrePorLead = new Map<string, string | null>();
  if (leadIds.length > 0) {
    const { data: leadsData } = await supabase
      .from("leads")
      .select("id,nombre")
      .in("id", leadIds);
    for (const l of leadsData ?? []) nombrePorLead.set(l.id, l.nombre ?? null);
  }

  const tipoPorVehiculo = new Map<string, string | null>();
  if (vehiculoIds.length > 0) {
    const { data: vehData } = await supabase
      .from("vehiculos")
      .select("id,tipo")
      .in("id", vehiculoIds);
    for (const v of vehData ?? []) tipoPorVehiculo.set(v.id, v.tipo ?? null);
  }

  function resolver(o: OperacionFila): OperacionCalendario {
    return {
      id: o.id,
      fecha: o.fecha,
      hora: o.hora,
      estado_operativo: o.estado_operativo,
      nombre: o.lead_id ? nombrePorLead.get(o.lead_id) ?? null : null,
      tipo: o.vehiculo_id ? tipoPorVehiculo.get(o.vehiculo_id) ?? null : null,
    };
  }

  // Agrupa por día (YYYY-MM-DD).
  const porDia = new Map<string, OperacionCalendario[]>();
  for (const fila of filasMes) {
    if (!fila.fecha) continue;
    const op = resolver(fila);
    const lista = porDia.get(fila.fecha) ?? [];
    lista.push(op);
    porDia.set(fila.fecha, lista);
  }

  const sinFecha = filasSinFecha.map(resolver);

  const prev = mesAnterior(year, month);
  const next = mesSiguiente(year, month);

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-medium capitalize">
          {nombreMes(month)} {year}
        </h1>
        <div className="flex items-center gap-1">
          <NavLink
            href={`/admin/calendario?y=${prev.year}&m=${prev.month}`}
            label="Mes anterior"
          >
            ←
          </NavLink>
          <Link
            href="/admin/calendario"
            className={btn({ variant: "secondary", size: "sm" })}
          >
            Hoy
          </Link>
          <NavLink
            href={`/admin/calendario?y=${next.year}&m=${next.month}`}
            label="Mes siguiente"
          >
            →
          </NavLink>
        </div>
      </div>

      {error && (
        <div className="mb-6 rounded-card border border-hairline bg-gris px-4 py-3 text-sm text-black/70">
          No se pudieron cargar las operaciones de este mes.
        </div>
      )}

      {/* En móvil el calendario se desplaza en horizontal para que las celdas
          sigan siendo legibles y pulsables; en escritorio ocupa todo el ancho. */}
      <div className="overflow-x-auto">
        <div className="min-w-[700px]">
      {/* Cabecera de días de la semana */}
      <div className="grid grid-cols-7 border-l border-t border-hairline text-xs font-medium uppercase tracking-wide text-black/50">
        {DIAS_SEMANA.map((d) => (
          <div key={d} className="border-b border-r border-hairline px-2 py-2">
            {d}
          </div>
        ))}
      </div>

      {/* Cuadrícula del mes */}
      <div className="grid grid-cols-7 border-l border-hairline">
        {dias.map((dia) => {
          const ops = porDia.get(dia.iso) ?? [];
          const visibles = ops.slice(0, MAX_POR_DIA);
          const resto = ops.length - visibles.length;
          return (
            <div
              key={dia.iso}
              className={`min-h-[112px] border-b border-r border-hairline p-1.5 ${
                dia.enMes ? "bg-white" : "bg-gris/40"
              }`}
            >
              <div className="mb-1 flex items-center justify-between px-0.5">
                <span
                  className={`inline-flex h-6 min-w-6 items-center justify-center rounded-pill px-1 text-xs ${
                    dia.esHoy
                      ? "bg-black font-semibold text-white"
                      : dia.enMes
                        ? "text-black/70"
                        : "text-black/30"
                  }`}
                >
                  {dia.dia}
                </span>
              </div>
              <div className="flex flex-col gap-1">
                {visibles.map((op) => (
                  <TarjetaOperacion key={op.id} op={op} />
                ))}
                {resto > 0 && (
                  <span className="px-1 text-[11px] font-medium text-black/50">
                    +{resto} más
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
        </div>
      </div>

      <Leyenda />

      {sinFecha.length > 0 && (
        <div className="mt-8">
          <h2 className="mb-3 text-xs font-medium uppercase tracking-wide text-black/50">
            Sin fecha asignada ({sinFecha.length})
          </h2>
          <div className="flex flex-wrap gap-2">
            {sinFecha.map((op) => (
              <Link
                key={op.id}
                href={`/admin/operaciones/${op.id}`}
                className="flex items-center gap-2 rounded-field border border-hairline px-3 py-2 text-sm transition-colors hover:bg-gris"
              >
                <span
                  className={`inline-block h-2.5 w-2.5 shrink-0 rounded-pill ${dotEstado(
                    op.estado_operativo
                  )}`}
                />
                <span className="font-medium">
                  {op.nombre?.trim() || "Cliente"}
                </span>
                <span className="text-black/50">
                  {op.tipo?.trim() || "sin vehículo"}
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function TarjetaOperacion({ op }: { op: OperacionCalendario }) {
  const hora = formatHora(op.hora);
  return (
    <Link
      href={`/admin/operaciones/${op.id}`}
      className="block rounded-field border border-hairline bg-white px-1.5 py-1 text-[11px] leading-tight transition-colors hover:bg-gris"
    >
      <div className="flex items-center gap-1">
        <span
          className={`inline-block h-2 w-2 shrink-0 rounded-pill ${dotEstado(
            op.estado_operativo
          )}`}
        />
        <span className="truncate font-medium text-black">
          {op.nombre?.trim() || "Cliente"}
        </span>
      </div>
      <div className="truncate pl-3 text-black/50">
        {hora && <span className="tabular-nums">{hora} · </span>}
        {op.tipo?.trim() || "sin vehículo"}
      </div>
    </Link>
  );
}

function NavLink({
  href,
  label,
  children,
}: {
  href: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-label={label}
      className="flex h-8 w-8 items-center justify-center rounded-pill border border-hairline text-sm transition-colors hover:bg-gris"
    >
      {children}
    </Link>
  );
}

function Leyenda() {
  return (
    <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[11px] text-black/50">
      {ESTADOS_OPERATIVOS.map((e) => (
        <span key={e} className="flex items-center gap-1.5">
          <span
            className={`inline-block h-2.5 w-2.5 rounded-pill ${dotEstado(e)}`}
          />
          {e}
        </span>
      ))}
    </div>
  );
}
