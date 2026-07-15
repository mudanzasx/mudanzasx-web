import Link from "next/link";
import { notFound } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { formatPrecio, formatVolumen, textoODash } from "@/lib/leads";
import OperacionForm, {
  type OperacionInicial,
  type OtraOperacion,
  type VehiculoOpcion,
  type OperarioOpcion,
} from "./OperacionForm";
import ServicioInventario, {
  type DetallePresupuesto,
} from "./ServicioInventario";

type OperacionDetalle = {
  id: string;
  lead_id: string | null;
  fecha: string | null;
  hora: string | null;
  vehiculo_id: string | null;
  operarios_ids: string[] | null;
  estado_operativo: string | null;
  volumen_m3: number | null;
  notas: string | null;
};

type LeadResumen = {
  id: string;
  nombre: string | null;
  telefono: string | null;
  origen_direccion: string | null;
  destino_direccion: string | null;
};

// Resumen de cobro de la operación (leído de la tabla `pagos`).
type PagoResumen = {
  importe_total: number | null;
  importe_pagado: number | null;
  importe_pendiente: number | null;
  estado: string | null;
};

export default async function OperacionDetallePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("operaciones")
    .select(
      "id,lead_id,fecha,hora,vehiculo_id,operarios_ids,estado_operativo,volumen_m3,notas"
    )
    .eq("id", id)
    .maybeSingle();

  if (error) {
    return (
      <div className="rounded-card border border-hairline bg-white shadow-card px-4 py-6 text-sm text-black/70">
        No se pudo cargar la operación.{" "}
        <Link href="/admin/calendario" className="underline underline-offset-2">
          Volver al calendario
        </Link>
        .
      </div>
    );
  }

  if (!data) {
    notFound();
  }

  const op = data as OperacionDetalle;

  // Cliente de la operación (consulta aparte por id).
  let lead: LeadResumen | null = null;
  if (op.lead_id) {
    const { data: leadData } = await supabase
      .from("leads")
      .select("id,nombre,telefono,origen_direccion,destino_direccion")
      .eq("id", op.lead_id)
      .maybeSingle();
    lead = (leadData as LeadResumen | null) ?? null;
  }

  // Presupuesto asociado a esta operación: el que se reservó (vinculado por la
  // fila de `pagos` del lead) o, en su defecto, el más reciente del lead. Su
  // detalle (jsonb) lleva el inventario, productos y accesos que se cotizaron.
  let detallePresupuesto: DetallePresupuesto | null = null;
  let volumenPresupuesto: number | null = op.volumen_m3;
  let pago: PagoResumen | null = null;
  if (op.lead_id) {
    const { data: pagosRows } = await supabase
      .from("pagos")
      .select(
        "presupuesto_id,estado,importe_total,importe_pagado,importe_pendiente"
      )
      .eq("lead_id", op.lead_id);
    const filas = pagosRows ?? [];
    const pagado = filas.find(
      (p) =>
        p.presupuesto_id &&
        (p.estado?.startsWith("Reserva") || p.estado?.startsWith("Pagado"))
    );
    const cualquiera = filas.find((p) => p.presupuesto_id);
    // Pago de referencia para el resumen de cobro (el reservado si lo hay).
    const elegido = pagado ?? cualquiera ?? filas[0] ?? null;
    if (elegido) {
      pago = {
        importe_total: elegido.importe_total ?? null,
        importe_pagado: elegido.importe_pagado ?? null,
        importe_pendiente: elegido.importe_pendiente ?? null,
        estado: elegido.estado ?? null,
      };
    }
    let presuId = (pagado ?? cualquiera)?.presupuesto_id ?? null;

    let presu:
      | { volumen_m3: number | null; detalle_objetos: DetallePresupuesto | null }
      | null = null;
    if (presuId) {
      const { data } = await supabase
        .from("presupuestos")
        .select("volumen_m3,detalle_objetos")
        .eq("id", presuId)
        .maybeSingle();
      presu = data ?? null;
    }
    if (!presu) {
      const { data } = await supabase
        .from("presupuestos")
        .select("id,volumen_m3,detalle_objetos")
        .eq("lead_id", op.lead_id)
        .order("creado_en", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (data) {
        presuId = data.id;
        presu = { volumen_m3: data.volumen_m3, detalle_objetos: data.detalle_objetos };
      }
    }
    if (presu) {
      detallePresupuesto = (presu.detalle_objetos as DetallePresupuesto) ?? null;
      if (presu.volumen_m3 !== null && presu.volumen_m3 !== undefined) {
        volumenPresupuesto = presu.volumen_m3;
      }
    }
  }

  // Catálogos para los selectores.
  const { data: vehiculosData } = await supabase
    .from("vehiculos")
    .select("id,tipo")
    .order("tipo", { ascending: true });
  const vehiculos = (vehiculosData ?? []) as VehiculoOpcion[];

  const { data: operariosData } = await supabase
    .from("operarios")
    .select("id,nombre,rol")
    .order("nombre", { ascending: true });
  const operarios = (operariosData ?? []) as OperarioOpcion[];

  // Resto de operaciones (con fecha) para detectar solapes de vehículo/operarios.
  // Se calcula en cliente contra la fecha/asignación elegida en el formulario.
  const { data: otrasData } = await supabase
    .from("operaciones")
    .select("id,fecha,vehiculo_id,operarios_ids,lead_id")
    .neq("id", id)
    .not("fecha", "is", null);
  const otrasFilas = (otrasData ?? []) as Array<{
    id: string;
    fecha: string | null;
    vehiculo_id: string | null;
    operarios_ids: string[] | null;
    lead_id: string | null;
  }>;

  // Nombres de los clientes de esas otras operaciones (una consulta).
  const otrosLeadIds = [
    ...new Set(
      otrasFilas
        .map((o) => o.lead_id)
        .filter((x): x is string => typeof x === "string" && x.length > 0)
    ),
  ];
  const nombrePorLead = new Map<string, string | null>();
  if (otrosLeadIds.length > 0) {
    const { data: nombresData } = await supabase
      .from("leads")
      .select("id,nombre")
      .in("id", otrosLeadIds);
    for (const l of nombresData ?? []) nombrePorLead.set(l.id, l.nombre ?? null);
  }

  const otras = otrasFilas.map(
    (o): OtraOperacion => ({
      id: o.id,
      fecha: o.fecha,
      vehiculo_id: o.vehiculo_id,
      operarios_ids: o.operarios_ids ?? [],
      cliente:
        (o.lead_id ? nombrePorLead.get(o.lead_id)?.trim() : "") ||
        "otra operación",
    })
  );

  const inicial: OperacionInicial = {
    fecha: op.fecha ?? "",
    hora: (op.hora ?? "").slice(0, 5),
    vehiculo_id: op.vehiculo_id ?? "",
    operarios_ids: op.operarios_ids ?? [],
    estado_operativo: op.estado_operativo ?? "Sin planificar",
    notas: op.notas ?? "",
  };

  return (
    <div className="mx-auto max-w-[900px]">
      <div className="mb-6">
        <Link
          href="/admin/calendario"
          className="text-sm text-black/60 underline-offset-2 hover:underline"
        >
          ← Volver al calendario
        </Link>
      </div>

      <h1 className="mb-8 text-2xl font-medium">
        {textoODash(lead?.nombre)}
      </h1>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* Cliente (solo lectura) */}
        <section className="rounded-card border border-hairline bg-white shadow-card p-5">
          <h2 className="mb-4 text-xs font-medium uppercase tracking-wide text-black/50">
            Cliente
          </h2>
          <div className="flex flex-col gap-3">
            <Campo label="Nombre" valor={textoODash(lead?.nombre)} />
            <Campo label="Teléfono" valor={textoODash(lead?.telefono)} />
            <Campo
              label="Origen"
              valor={textoODash(lead?.origen_direccion)}
            />
            <Campo
              label="Destino"
              valor={textoODash(lead?.destino_direccion)}
            />
            <Campo label="Volumen" valor={formatVolumen(op.volumen_m3)} />
            {lead?.id && (
              <Link
                href={`/admin/leads/${lead.id}`}
                className="mt-1 text-sm text-black/60 underline underline-offset-2 hover:text-black"
              >
                Ver ficha del cliente →
              </Link>
            )}

            {/* Estado de cobro de la mudanza (solo lectura). */}
            <div className="mt-1 border-t border-hairline pt-3">
              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-black/50">
                Cobro
              </p>
              <PagoEstado pago={pago} />
            </div>
          </div>
        </section>

        {/* Planificación (editable) */}
        <OperacionForm
          id={op.id}
          inicial={inicial}
          vehiculos={vehiculos}
          operarios={operarios}
          otras={otras}
        />
      </div>

      {/* Servicio e inventario del presupuesto asociado (solo lectura). */}
      <div className="mt-8">
        <ServicioInventario
          detalle={detallePresupuesto}
          volumenM3={volumenPresupuesto}
        />
      </div>
    </div>
  );
}

function Campo({ label, valor }: { label: string; valor: string }) {
  return (
    <div className="flex flex-col gap-0.5 sm:flex-row sm:justify-between sm:gap-4">
      <span className="text-sm text-black/50">{label}</span>
      <span className="text-sm text-black sm:text-right">{valor}</span>
    </div>
  );
}

// Resumen del cobro: importes y un aviso destacado según quede o no pendiente.
function PagoEstado({ pago }: { pago: PagoResumen | null }) {
  if (!pago) {
    return (
      <p className="rounded-card border border-dashed border-hairline px-3 py-2 text-sm text-black/50">
        Sin pago registrado.
      </p>
    );
  }

  const hayPendiente = Number(pago.importe_pendiente ?? 0) > 0;
  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-3 gap-x-4">
        <ResumenCobro label="Total" valor={formatPrecio(pago.importe_total)} />
        <ResumenCobro label="Pagado" valor={formatPrecio(pago.importe_pagado)} />
        <ResumenCobro
          label="Pendiente"
          valor={formatPrecio(pago.importe_pendiente)}
        />
      </div>
      {hayPendiente ? (
        <p className="rounded-card bg-amber-50 px-3 py-2 text-sm font-medium text-amber-700">
          Pago pendiente: {formatPrecio(pago.importe_pendiente)}
        </p>
      ) : (
        <p className="rounded-card bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700">
          Pagado completo
        </p>
      )}
    </div>
  );
}

function ResumenCobro({ label, valor }: { label: string; valor: string }) {
  return (
    <div>
      <p className="text-[11px] uppercase tracking-wide text-black/40">{label}</p>
      <p className="mt-0.5 text-sm font-medium tabular-nums text-black">{valor}</p>
    </div>
  );
}
