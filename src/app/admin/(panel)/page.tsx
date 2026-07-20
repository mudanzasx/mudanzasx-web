import Link from "next/link";
import { Phone } from "lucide-react";
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
import { btn } from "@/components/ui/button";

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
          className={btn({ variant: "primary", size: "md" })}
        >
          + Nuevo lead
        </Link>
      </div>

      <div className="mb-6">
        <LeadsFilters q={q} estado={estado} />
      </div>

      {error ? (
        <div className="rounded-card border border-hairline bg-white px-4 py-6 text-sm text-black/70 shadow-card">
          No se pudieron cargar los clientes. Inténtalo de nuevo más tarde.
        </div>
      ) : leads.length === 0 ? (
        <EmptyState filtrado={Boolean(term || estado)} />
      ) : (
        <>
          {/* Escritorio: tabla (igual que antes; funciona bien con ese ancho). */}
          <div className="hidden overflow-x-auto rounded-card border border-hairline bg-white shadow-card md:block">
          <table className="w-full min-w-[860px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-hairline text-left text-xs uppercase tracking-wide text-black/50">
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
                  className="relative cursor-pointer border-b border-hairline transition-colors last:border-b-0 hover:bg-gris/60"
                >
                  <Td>
                    <div className="flex flex-wrap items-center gap-2">
                      <Link
                        href={`/admin/leads/${lead.id}`}
                        className="font-medium text-black underline-offset-2 after:absolute after:inset-0 after:content-[''] hover:underline"
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

          {/* Móvil: tarjetas apiladas (sin scroll horizontal). Misma lista de
              leads del servidor, así que el buscador, el filtro por estado y el
              aviso en tiempo real (router.refresh) afectan también a esta vista. */}
          <ul className="flex flex-col gap-3 md:hidden">
            {leads.map((lead) => (
              <li key={lead.id}>
                <LeadCard
                  lead={lead}
                  pagoPendiente={pagosPendientes.has(lead.id)}
                />
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}

// Tarjeta de lead para MÓVIL: blanca sobre el gris del panel, escaneable. Toda la
// tarjeta navega a la ficha (enlace estirado con ::after). El teléfono es una
// acción propia (tel:) por encima del overlay (relative z-10), para que llamar
// NO abra también la ficha: dos acciones bien diferenciadas.
function LeadCard({
  lead,
  pagoPendiente,
}: {
  lead: Lead;
  pagoPendiente: boolean;
}) {
  const tel = (lead.telefono ?? "").replace(/\s+/g, "");
  return (
    <div className="relative rounded-card border border-hairline bg-white shadow-card">
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <h3 className="min-w-0 flex-1 truncate text-base font-medium text-black">
            <Link
              href={`/admin/leads/${lead.id}`}
              className="rounded-field outline-none after:absolute after:inset-0 after:content-[''] hover:underline focus-visible:underline"
            >
              {textoODash(lead.nombre)}
            </Link>
          </h3>
          <div className="shrink-0">
            <EstadoPill estado={lead.estado_comercial} colorize />
          </div>
        </div>

        <p className="mt-1.5 truncate text-sm text-black/60">
          {formatRuta(lead.origen_direccion, lead.destino_direccion, 28)}
        </p>

        {pagoPendiente && (
          <div className="mt-2">
            <BadgePagoPendiente />
          </div>
        )}
      </div>

      {/* Pie: teléfono pulsable (acción propia) + fecha de entrada discreta. */}
      <div className="flex items-center justify-between gap-2 border-t border-hairline px-4">
        {tel ? (
          <a
            href={`tel:${tel}`}
            className="relative z-10 inline-flex min-h-[44px] items-center gap-2 rounded-field pr-2 text-sm font-medium text-black outline-none hover:underline focus-visible:ring-2 focus-visible:ring-black/40"
          >
            <Phone size={16} strokeWidth={1.5} aria-hidden />
            {textoODash(lead.telefono)}
          </a>
        ) : (
          <span className="inline-flex min-h-[44px] items-center text-sm text-black/40">
            Sin teléfono
          </span>
        )}
        <span className="shrink-0 text-xs text-black/40">
          {formatFechaHora(lead.creado_en)}
        </span>
      </div>
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return <th className="px-4 py-3 font-medium">{children}</th>;
}

// Aviso sobrio (ámbar apagado) de que al lead le queda dinero por cobrar.
function BadgePagoPendiente() {
  return (
    <span className="inline-flex items-center gap-1 whitespace-nowrap rounded-pill bg-status-warning-surface px-1.5 py-0.5 text-[11px] font-medium text-status-warning-text">
      <span className="h-1.5 w-1.5 rounded-pill bg-status-warning-accent" aria-hidden />
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
    <div className="rounded-card border border-dashed border-hairline bg-white px-6 py-16 text-center shadow-card">
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
          className={btn({ variant: "secondary", size: "sm", className: "mt-6" })}
        >
          Ver todos
        </Link>
      )}
    </div>
  );
}
