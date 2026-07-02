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
                    <Link
                      href={`/admin/leads/${lead.id}`}
                      className="font-medium text-black underline-offset-2 hover:underline"
                    >
                      {textoODash(lead.nombre)}
                    </Link>
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
