import Link from "next/link";
import { notFound } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  type Lead,
  esEstadoComercial,
  formatFecha,
  formatFechaHora,
  formatRangoPrecio,
  formatVolumen,
  parsePlantaNum,
  textoODash,
} from "@/lib/leads";
import EstadoPill from "@/components/admin/EstadoPill";
import EditLeadForm, { type LeadInicial } from "./EditLeadForm";
import PedirValoracionBoton from "./PedirValoracionBoton";
import PresupuestoPanel, {
  type PresupuestoGuardado,
} from "./PresupuestoPanel";
import { type DatosCliente } from "./PresupuestoForm";
import { type Pago } from "./pagoActions";

export default async function LeadDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ pago?: string }>;
}) {
  const { id } = await params;
  const { pago: pagoParam } = await searchParams;
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
  const { data: presupuestosData } = await supabase
    .from("presupuestos")
    .select(
      "id,creado_en,precio_final,vehiculo,operarios,horas,volumen_m3,estado,fecha_mudanza,detalle_objetos"
    )
    .eq("lead_id", id)
    .order("creado_en", { ascending: false });
  const presupuestos = (presupuestosData ?? []) as PresupuestoGuardado[];

  // Resumen de la operación estimada: sale del presupuesto más reciente para
  // mostrar de un vistazo horas, vehículo, operarios e inventario en "Detalles
  // de la mudanza". El inventario completo vive en la operación del calendario;
  // aquí basta con los totales.
  const ultimoPresupuesto = presupuestos[0] ?? null;
  const snapshot = ultimoPresupuesto?.detalle_objetos ?? null;
  // Resumen de la operación (volúmenes, esfuerzo y duración). Presente en los
  // snapshots v3+; en presupuestos antiguos se cae con elegancia a los datos
  // sueltos del propio presupuesto.
  const resumen = snapshot?.resumen ?? null;
  const totalObjetos =
    snapshot?.objetos?.reduce((s, o) => s + (o.cantidad || 0), 0) ?? null;
  const totalProductos =
    snapshot?.productos?.reduce((s, p) => s + (p.cantidad || 0), 0) ?? null;
  const resumenInventario =
    [
      totalObjetos != null
        ? `${totalObjetos} ${totalObjetos === 1 ? "objeto" : "objetos"}`
        : null,
      totalProductos
        ? `${totalProductos} ${totalProductos === 1 ? "producto" : "productos"}`
        : null,
    ]
      .filter(Boolean)
      .join(" · ") || "—";

  // Pagos de este cliente, mapeados por presupuesto.
  const { data: pagosData } = await supabase
    .from("pagos")
    .select(
      "id,presupuesto_id,lead_id,importe_total,importe_pagado,importe_pendiente,tipo,estado,metodo,stripe_id"
    )
    .eq("lead_id", id);
  const pagosPorPresupuesto: Record<string, Pago> = {};
  for (const p of (pagosData ?? []) as Pago[]) {
    if (p.presupuesto_id) pagosPorPresupuesto[p.presupuesto_id] = p;
  }

  const accesosDefault = {
    origen_planta: parsePlantaNum(lead.origen_planta),
    origen_ascensor: Boolean(lead.origen_ascensor),
    destino_planta: parsePlantaNum(lead.destino_planta),
    destino_ascensor: Boolean(lead.destino_ascensor),
  };

  // Valores editables actuales de la ficha (para el formulario editable).
  const inicial: LeadInicial = {
    nombre: lead.nombre ?? "",
    telefono: lead.telefono ?? "",
    email: lead.email ?? "",
    origen_direccion: lead.origen_direccion ?? "",
    origen_planta: lead.origen_planta ?? "",
    origen_ascensor: Boolean(lead.origen_ascensor),
    destino_direccion: lead.destino_direccion ?? "",
    destino_planta: lead.destino_planta ?? "",
    destino_ascensor: Boolean(lead.destino_ascensor),
    estado_comercial: estadoInicial,
    notas: lead.notas ?? "",
  };

  // Valores crudos del lead para el botón "Usar datos del cliente" del
  // presupuesto (null = vacío -> ese campo se deja como esté).
  const datosCliente: DatosCliente = {
    origen_planta: lead.origen_planta ?? null,
    origen_ascensor: lead.origen_ascensor ?? null,
    destino_planta: lead.destino_planta ?? null,
    destino_ascensor: lead.destino_ascensor ?? null,
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

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-medium">{textoODash(lead.nombre)}</h1>
        <EstadoPill estado={lead.estado_comercial} colorize />
      </div>

      {/* Acciones de cliente (email). La valoración es útil sobre todo con el
          lead ya "Finalizado", pero está disponible en cualquier estado. */}
      <div className="mb-8">
        <PedirValoracionBoton leadId={lead.id} />
      </div>

      {pagoParam === "ok" && (
        <div className="mb-6 rounded-lg border border-black/15 bg-gris px-4 py-3 text-sm">
          Pago recibido. La reserva se ha confirmado y el cliente está marcado
          como Reservado.
        </div>
      )}
      {pagoParam === "cancelado" && (
        <div className="mb-6 rounded-lg border border-black/15 px-4 py-3 text-sm text-black/60">
          El cliente canceló o cerró el pago sin completarlo.
        </div>
      )}

      {/* Ficha editable: contacto + origen + destino + gestión, un solo Guardar */}
      <div className="mb-8">
        <EditLeadForm id={lead.id} inicial={inicial} />
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* Datos derivados (solo lectura) */}
        <div className="flex flex-col gap-6">
          <Section title="Detalles de la mudanza">
            <Field label="Fecha deseada" value={formatFecha(lead.fecha_deseada)} />
            <Field label="Tamaño aproximado" value={textoODash(lead.tamano_aprox)} />
            <Field
              label="Volumen objetos"
              value={formatVolumen(
                resumen?.volumen_neto_m3 ?? lead.volumen_estimado_m3
              )}
            />
            {resumen && (
              <Field
                label="Espacio en vehículo"
                value={formatVolumen(resumen.volumen_real_ocupado_m3)}
              />
            )}
            <Field
              label="Precio aproximado"
              value={formatRangoPrecio(
                lead.precio_aprox_min,
                lead.precio_aprox_max
              )}
            />
            {resumen ? (
              <>
                <Field
                  label="Trabajo estimado"
                  value={`${resumen.horas_trabajo_persona.toLocaleString("es-ES", {
                    maximumFractionDigits: 1,
                  })} h-persona`}
                />
                <Field
                  label="Duración estimada"
                  value={`${resumen.duracion_total_h.toLocaleString("es-ES", {
                    maximumFractionDigits: 1,
                  })} h`}
                />
                <Field label="Vehículo" value={textoODash(resumen.vehiculo)} />
                <Field label="Operarios" value={String(resumen.operarios)} />
                <Field label="Días" value={String(resumen.dias)} />
                <Field label="Inventario" value={resumenInventario} />
              </>
            ) : ultimoPresupuesto ? (
              <>
                <Field
                  label="Horas estimadas"
                  value={
                    ultimoPresupuesto.horas != null
                      ? `${ultimoPresupuesto.horas.toLocaleString("es-ES", {
                          maximumFractionDigits: 1,
                        })} h`
                      : "—"
                  }
                />
                <Field
                  label="Vehículo"
                  value={textoODash(ultimoPresupuesto.vehiculo)}
                />
                <Field
                  label="Operarios"
                  value={
                    ultimoPresupuesto.operarios != null
                      ? String(ultimoPresupuesto.operarios)
                      : "—"
                  }
                />
                {snapshot && (
                  <Field label="Inventario" value={resumenInventario} />
                )}
              </>
            ) : null}
          </Section>

          <Section title="Origen del contacto">
            <Field label="Vía de entrada" value={textoODash(lead.via_entrada)} />
            <Field
              label="Fecha de entrada"
              value={formatFechaHora(lead.creado_en)}
            />
          </Section>
        </div>

        {/* Presupuesto (incluye el cobro con Stripe dentro de cada presupuesto) */}
        <div className="flex flex-col gap-6">
          <Section title="Presupuesto">
            <PresupuestoPanel
              leadId={lead.id}
              accesosDefault={accesosDefault}
              datosCliente={datosCliente}
              presupuestos={presupuestos}
              pagosPorPresupuesto={pagosPorPresupuesto}
            />
          </Section>
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

