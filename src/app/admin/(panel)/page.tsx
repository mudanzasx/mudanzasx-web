import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  type Lead,
  esEstadoComercial,
  formatFecha,
  formatFechaHora,
  formatRuta,
  textoODash,
} from "@/lib/leads";
import EstadoPill from "@/components/admin/EstadoPill";
import LeadsFilters from "@/components/admin/LeadsFilters";

const COLUMNAS: (keyof Lead)[] = [
  "id",
  "creado_en",
  "nombre",
  "telefono",
  "origen_direccion",
  "destino_direccion",
  "fecha_deseada",
  "tamano_aprox",
  "estado_comercial",
];

export default async function AdminDashboard({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; estado?: string }>;
}) {
  const { q = "", estado = "" } = await searchParams;
  const supabase = await createSupabaseServerClient();

  let query = supabase
    .from("leads")
    .select(COLUMNAS.join(","))
    .order("creado_en", { ascending: false });

  const term = q.trim();
  if (term) {
    // Búsqueda por nombre o teléfono. Escapamos comas/paréntesis del patrón `or`.
    const safe = term.replace(/[,()]/g, " ");
    query = query.or(`nombre.ilike.%${safe}%,telefono.ilike.%${safe}%`);
  }
  if (esEstadoComercial(estado)) {
    query = query.eq("estado_comercial", estado);
  }

  const { data, error } = await query;
  const leads = (data ?? []) as unknown as Lead[];

  // Estado de cobro de los leads visibles: UNA sola consulta a `pagos` por sus
  // ids. Un lead tiene pago pendiente si alguna fila mantiene importe_pendiente
  // > 0 (p. ej. una "Reserva 50%" sin cobrar el resto).
  const pagosPendientes = new Set<string>();
  const leadIds = leads.map((l) => l.id).filter(Boolean);
  if (leadIds.length > 0) {
    const { data: pagosData } = await supabase
      .from("pagos")
      .select("lead_id,importe_pendiente")
      .in("lead_id", leadIds);
    for (const p of pagosData ?? []) {
      if (p.lead_id && Number(p.importe_pendiente) > 0) {
        pagosPendientes.add(p.lead_id);
      }
    }
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-baseline gap-3">
          <h1 className="text-xl font-medium">Clientes potenciales</h1>
          <span className="text-sm text-black/50">
            {leads.length}{" "}
            {leads.length === 1 ? "cliente" : "clientes"}
            {term || estado ? " (filtrados)" : ""}
          </span>
        </div>
        <Link
          href="/admin/leads/nuevo"
          className="rounded-full bg-black px-5 py-2.5 text-sm font-medium text-white transition-colors duration-150 hover:bg-black/85"
        >
          + Nuevo lead
        </Link>
      </div>

      <div className="mb-6">
        <LeadsFilters q={q} estado={estado} />
      </div>

      {error ? (
        <div className="rounded-lg border border-black/10 bg-gris px-4 py-6 text-sm text-black/70">
          No se pudieron cargar los clientes. Inténtalo de nuevo más tarde.
        </div>
      ) : leads.length === 0 ? (
        <EmptyState filtrado={Boolean(term || estado)} />
      ) : (
        <div className="overflow-x-auto rounded-lg border border-black/10">
          <table className="w-full min-w-[860px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-black/10 text-left text-xs uppercase tracking-wide text-black/50">
                <Th>Nombre</Th>
                <Th>Teléfono</Th>
                <Th>Ruta</Th>
                <Th>Fecha deseada</Th>
                <Th>Tamaño</Th>
                <Th>Estado</Th>
                <Th>Fecha de entrada</Th>
              </tr>
            </thead>
            <tbody>
              {leads.map((lead) => (
                <tr
                  key={lead.id}
                  className="border-b border-black/5 transition-colors last:border-b-0 hover:bg-gris/60"
                >
                  <Td>
                    <div className="flex flex-wrap items-center gap-2">
                      <Link
                        href={`/admin/leads/${lead.id}`}
                        className="font-medium text-black underline-offset-2 hover:underline"
                      >
                        {textoODash(lead.nombre)}
                      </Link>
                      {pagosPendientes.has(lead.id) && <BadgePagoPendiente />}
                    </div>
                  </Td>
                  <Td>{textoODash(lead.telefono)}</Td>
                  <Td className="text-black/70">
                    {formatRuta(lead.origen_direccion, lead.destino_direccion)}
                  </Td>
                  <Td>{formatFecha(lead.fecha_deseada)}</Td>
                  <Td>{textoODash(lead.tamano_aprox)}</Td>
                  <Td>
                    <EstadoPill estado={lead.estado_comercial} colorize />
                  </Td>
                  <Td className="whitespace-nowrap text-black/70">
                    {formatFechaHora(lead.creado_en)}
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return <th className="px-4 py-3 font-medium">{children}</th>;
}

// Aviso sobrio (ámbar apagado) de que al lead le queda dinero por cobrar.
function BadgePagoPendiente() {
  return (
    <span className="inline-flex items-center gap-1 whitespace-nowrap rounded bg-amber-50 px-1.5 py-0.5 text-[11px] font-medium text-amber-700">
      <span className="h-1.5 w-1.5 rounded-full bg-amber-500" aria-hidden />
      Pago pendiente
    </span>
  );
}

function Td({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <td className={`px-4 py-3 align-middle ${className}`}>{children}</td>;
}

function EmptyState({ filtrado }: { filtrado: boolean }) {
  return (
    <div className="rounded-lg border border-dashed border-black/15 px-6 py-16 text-center">
      <p className="text-base font-medium text-black">
        {filtrado ? "Sin resultados" : "Aún no hay clientes"}
      </p>
      <p className="mt-1 text-sm text-black/50">
        {filtrado
          ? "Prueba a cambiar la búsqueda o el filtro de estado."
          : "Las solicitudes de la web aparecerán aquí automáticamente."}
      </p>
      {filtrado && (
        <Link
          href="/admin"
          className="mt-6 inline-block rounded-full border border-black/15 px-4 py-2 text-sm font-medium transition-colors hover:bg-gris"
        >
          Ver todos
        </Link>
      )}
    </div>
  );
}
