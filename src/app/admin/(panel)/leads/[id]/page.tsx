import Link from "next/link";
import { notFound } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  type Lead,
  esEstadoComercial,
  formatAscensor,
  formatFecha,
  formatFechaHora,
  formatPrecio,
  formatRangoPrecio,
  formatVolumen,
  parsePlantaNum,
  textoODash,
} from "@/lib/leads";
import EstadoPill from "@/components/admin/EstadoPill";
import EditLeadForm from "./EditLeadForm";
import PresupuestoForm from "./PresupuestoForm";

export default async function LeadDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("leads")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    return (
      <div className="rounded-lg border border-black/10 bg-gris px-4 py-6 text-sm text-black/70">
        No se pudo cargar el cliente.{" "}
        <Link href="/admin" className="underline underline-offset-2">
          Volver a la lista
        </Link>
        .
      </div>
    );
  }

  if (!data) {
    notFound();
  }

  const lead = data as Lead;
  const estadoInicial = esEstadoComercial(lead.estado_comercial)
    ? lead.estado_comercial
    : "Nuevo";

  // Presupuestos ya guardados de este cliente (más nuevos primero).
  const { data: presupuestos } = await supabase
    .from("presupuestos")
    .select(
      "id,creado_en,volumen_m3,vehiculo,operarios,horas,precio_final,estado"
    )
    .eq("lead_id", id)
    .order("creado_en", { ascending: false });

  const accesosDefault = {
    origen_planta: parsePlantaNum(lead.origen_planta),
    origen_ascensor: Boolean(lead.origen_ascensor),
    destino_planta: parsePlantaNum(lead.destino_planta),
    destino_ascensor: Boolean(lead.destino_ascensor),
  };

  return (
    <div className="mx-auto max-w-[900px]">
      <div className="mb-6">
        <Link
          href="/admin"
          className="text-sm text-black/60 underline-offset-2 hover:underline"
        >
          ← Volver a la lista
        </Link>
      </div>

      <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-medium">{textoODash(lead.nombre)}</h1>
        <EstadoPill estado={lead.estado_comercial} />
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* Datos del lead (solo lectura) */}
        <div className="flex flex-col gap-6">
          <Section title="Contacto">
            <Field label="Nombre" value={textoODash(lead.nombre)} />
            <Field label="Teléfono" value={textoODash(lead.telefono)} />
            <Field label="Email" value={textoODash(lead.email)} />
          </Section>

          <Section title="Origen">
            <Field label="Dirección" value={textoODash(lead.origen_direccion)} />
            <Field label="Planta" value={textoODash(lead.origen_planta)} />
            <Field label="Ascensor" value={formatAscensor(lead.origen_ascensor)} />
          </Section>

          <Section title="Destino">
            <Field label="Dirección" value={textoODash(lead.destino_direccion)} />
            <Field label="Planta" value={textoODash(lead.destino_planta)} />
            <Field
              label="Ascensor"
              value={formatAscensor(lead.destino_ascensor)}
            />
          </Section>

          <Section title="Detalles de la mudanza">
            <Field label="Fecha deseada" value={formatFecha(lead.fecha_deseada)} />
            <Field label="Tamaño aproximado" value={textoODash(lead.tamano_aprox)} />
            <Field
              label="Volumen estimado"
              value={formatVolumen(lead.volumen_estimado_m3)}
            />
            <Field
              label="Precio aproximado"
              value={formatRangoPrecio(
                lead.precio_aprox_min,
                lead.precio_aprox_max
              )}
            />
          </Section>

          <Section title="Origen del contacto">
            <Field label="Vía de entrada" value={textoODash(lead.via_entrada)} />
            <Field
              label="Fecha de entrada"
              value={formatFechaHora(lead.creado_en)}
            />
          </Section>
        </div>

        {/* Gestión (editable) + marcadores de fases siguientes */}
        <div className="flex flex-col gap-6">
          <Section title="Gestión">
            <EditLeadForm
              id={lead.id}
              estadoInicial={estadoInicial}
              notasInicial={lead.notas ?? ""}
            />
          </Section>

          <Section title="Presupuesto">
            {presupuestos && presupuestos.length > 0 && (
              <div className="mb-5 flex flex-col gap-2">
                {presupuestos.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between gap-3 rounded-lg border border-black/10 px-3 py-2 text-sm"
                  >
                    <div className="min-w-0">
                      <p className="font-medium tabular-nums">
                        {formatPrecio(p.precio_final)}
                      </p>
                      <p className="text-xs text-black/50">
                        {formatFechaHora(p.creado_en)} · {textoODash(p.vehiculo)} ·{" "}
                        {p.operarios ?? "—"} operarios
                      </p>
                    </div>
                    <EstadoPill estado={p.estado} />
                  </div>
                ))}
              </div>
            )}
            <PresupuestoForm leadId={lead.id} accesosDefault={accesosDefault} />
          </Section>
          <PlaceholderSection title="Pago" />
          <PlaceholderSection title="Planificación" />
        </div>
      </div>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-lg border border-black/10 p-5">
      <h2 className="mb-4 text-xs font-medium uppercase tracking-wide text-black/50">
        {title}
      </h2>
      <div className="flex flex-col gap-3">{children}</div>
    </section>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5 sm:flex-row sm:justify-between sm:gap-4">
      <span className="text-sm text-black/50">{label}</span>
      <span className="text-sm text-black sm:text-right">{value}</span>
    </div>
  );
}

function PlaceholderSection({ title }: { title: string }) {
  return (
    <section className="rounded-lg border border-dashed border-black/15 p-5">
      <h2 className="text-xs font-medium uppercase tracking-wide text-black/40">
        {title}
      </h2>
      <p className="mt-2 text-sm text-black/40">Disponible en una fase posterior.</p>
    </section>
  );
}
