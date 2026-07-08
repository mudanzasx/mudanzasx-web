import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { dotEstado, formatHora, nombreMes } from "@/lib/operaciones";

// Vista de un día del calendario: lista TODAS las operaciones de esa fecha (sin
// el límite de la cuadrícula), a la que enlaza el "+N más" de cada celda. Así
// ninguna operación queda inaccesible desde el calendario.

type Fila = {
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

function fechaLegible(iso: string): string {
  const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return iso;
  const [, y, mm, dd] = m;
  return `${Number(dd)} de ${nombreMes(Number(mm))} de ${y}`;
}

export default async function DiaCalendarioPage({
  params,
}: {
  params: Promise<{ fecha: string }>;
}) {
  const { fecha } = await params;
  const valida = /^\d{4}-\d{2}-\d{2}$/.test(fecha);
  const supabase = await createSupabaseServerClient();

  const { data } = valida
    ? await supabase
        .from("operaciones")
        .select("id,fecha,hora,estado_operativo,lead_id,vehiculo_id")
        .eq("fecha", fecha)
        .order("hora", { ascending: true, nullsFirst: true })
    : { data: [] as Fila[] };
  const filas = (data ?? []) as Fila[];

  // Resuelve nombres de cliente y tipos de vehículo (join en memoria por id).
  const leadIds = [...new Set(filas.map((o) => o.lead_id).filter(esTexto))];
  const vehiculoIds = [...new Set(filas.map((o) => o.vehiculo_id).filter(esTexto))];

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

  return (
    <div className="mx-auto max-w-[720px]">
      <Link
        href="/admin/calendario"
        className="text-sm text-black/60 transition-colors hover:text-black"
      >
        ← Volver al calendario
      </Link>
      <h1 className="mt-3 text-xl font-medium">
        {valida ? fechaLegible(fecha) : "Fecha no válida"}
      </h1>
      <p className="mt-1 text-sm text-black/50">
        {filas.length} {filas.length === 1 ? "operación" : "operaciones"}
      </p>

      {filas.length === 0 ? (
        <p className="mt-6 rounded-card border border-hairline bg-gris px-4 py-6 text-center text-sm text-black/50">
          No hay operaciones este día.
        </p>
      ) : (
        <div className="mt-6 flex flex-col gap-2">
          {filas.map((op) => {
            const nombre = op.lead_id ? nombrePorLead.get(op.lead_id) ?? null : null;
            const tipo = op.vehiculo_id
              ? tipoPorVehiculo.get(op.vehiculo_id) ?? null
              : null;
            const hora = formatHora(op.hora);
            return (
              <Link
                key={op.id}
                href={`/admin/operaciones/${op.id}`}
                className="flex items-center gap-3 rounded-card border border-hairline bg-white px-4 py-3 shadow-card transition-colors hover:bg-gris"
              >
                <span
                  className={`inline-block h-2.5 w-2.5 shrink-0 rounded-pill ${dotEstado(
                    op.estado_operativo
                  )}`}
                />
                {hora && (
                  <span className="shrink-0 text-sm font-medium tabular-nums text-black">
                    {hora}
                  </span>
                )}
                <span className="min-w-0 flex-1 truncate font-medium text-black">
                  {nombre?.trim() || "Cliente"}
                </span>
                <span className="shrink-0 text-sm text-black/50">
                  {tipo?.trim() || "sin vehículo"}
                </span>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
