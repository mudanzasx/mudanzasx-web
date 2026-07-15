"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown } from "lucide-react";
import { formatPrecio, formatFechaHora } from "@/lib/leads";
import EstadoPill from "@/components/admin/EstadoPill";
import PresupuestoForm, {
  type AccesosDefault,
  type DatosCliente,
  type PresupuestoPayload,
} from "./PresupuestoForm";
import PagoPresupuesto from "./PagoPresupuesto";
import EnviarResumenBoton from "./EnviarResumenBoton";
import { btn } from "@/components/ui/button";
import { type Pago } from "./pagoActions";

export type PresupuestoGuardado = {
  id: string;
  creado_en: string | null;
  precio_final: number | null;
  vehiculo: string | null;
  operarios: number | null;
  horas: number | null;
  volumen_m3: number | null;
  estado: string | null;
  fecha_mudanza: string | null;
  detalle_objetos: PresupuestoPayload | null;
};

export default function PresupuestoPanel({
  leadId,
  accesosDefault,
  datosCliente,
  presupuestos,
  pagosPorPresupuesto,
}: {
  leadId: string;
  accesosDefault: AccesosDefault;
  datosCliente: DatosCliente;
  presupuestos: PresupuestoGuardado[];
  pagosPorPresupuesto: Record<string, Pago>;
}) {
  const router = useRouter();
  const [editId, setEditId] = useState<string | null>(null);
  const [initial, setInitial] = useState<PresupuestoPayload | null>(null);
  const [initialFecha, setInitialFecha] = useState<string | null>(null);
  // Cambia con cada carga/nuevo para forzar el remonte del formulario.
  const [formKey, setFormKey] = useState(0);
  // El formulario empieza plegado; se abre solo al usarlo (nuevo/editar) o al
  // pulsar su cabecera.
  const [formOpen, setFormOpen] = useState(false);

  function abrir(p: PresupuestoGuardado) {
    // Solo se puede reabrir si el snapshot es del formato nuevo (v2).
    if (!p.detalle_objetos || p.detalle_objetos.version == null) return;
    setEditId(p.id);
    setInitial(p.detalle_objetos);
    setInitialFecha(p.fecha_mudanza);
    setFormKey((k) => k + 1);
    setFormOpen(true);
  }

  function nuevo() {
    setEditId(null);
    setInitial(null);
    setInitialFecha(null);
    setFormKey((k) => k + 1);
    setFormOpen(true);
  }

  function onSaved(id: string) {
    // Tras guardar un presupuesto NUEVO, adoptamos su id → el formulario pasa a
    // modo "Actualizar" y un segundo guardado actualiza esa MISMA fila en vez de
    // insertar un duplicado. No se remonta (formKey no cambia), así se conservan
    // los valores para seguir editándolo. Si ya se estaba editando uno guardado,
    // editId no cambia (sigue actualizando el mismo). "+ Nuevo presupuesto"
    // vuelve a poner editId a null y empieza en blanco.
    if (editId === null) setEditId(id);
    // La lista se recarga desde el servidor; el estado del formulario se mantiene.
    router.refresh();
  }

  const reabrible = (p: PresupuestoGuardado) =>
    Boolean(p.detalle_objetos && p.detalle_objetos.version != null);

  return (
    <div className="flex flex-col gap-4">
      {presupuestos.length > 0 && (
        <div className="flex flex-col gap-2">
          {presupuestos.map((p) => {
            const activo = p.id === editId;
            const puede = reabrible(p);
            return (
              <div
                key={p.id}
                className={`rounded-card border bg-white shadow-card transition-colors ${
                  activo ? "border-black" : "border-hairline"
                }`}
              >
                <button
                  type="button"
                  onClick={() => abrir(p)}
                  disabled={!puede}
                  className={`flex w-full items-center justify-between gap-3 rounded-t-card px-3 py-2 text-left text-sm transition-colors ${
                    puede ? "hover:bg-gris" : "cursor-default"
                  } ${activo ? "bg-gris" : ""}`}
                >
                  <div className="min-w-0">
                    <p className="font-medium tabular-nums">
                      {formatPrecio(p.precio_final)}
                    </p>
                    <p className="text-xs text-black/50">
                      {formatFechaHora(p.creado_en)} · {p.vehiculo ?? "—"} ·{" "}
                      {p.operarios ?? "—"} operarios
                      {!puede && " · (formato antiguo)"}
                    </p>
                  </div>
                  <EstadoPill estado={p.estado} />
                </button>

                <div className="px-3 pb-3">
                  <div className="mb-2">
                    <EnviarResumenBoton presupuestoId={p.id} />
                  </div>
                  <PagoPresupuesto
                    presupuestoId={p.id}
                    precioFinal={p.precio_final}
                    pagoInicial={pagosPorPresupuesto[p.id] ?? null}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Acordeón: formulario de crear/editar presupuesto. Plegado por defecto
          para no ocupar espacio; se abre al pulsar la cabecera, al reabrir un
          presupuesto guardado o al pulsar "+ Nuevo presupuesto". */}
      <div className="rounded-card border border-hairline bg-white shadow-card">
        <button
          type="button"
          onClick={() => setFormOpen((o) => !o)}
          aria-expanded={formOpen}
          className="flex w-full items-center justify-between gap-3 rounded-card px-4 py-3 text-left transition-colors hover:bg-gris/60"
        >
          <span className="text-sm font-medium">
            {editId ? "Editar presupuesto" : "Nuevo presupuesto"}
          </span>
          <ChevronDown
            size={18}
            className={`shrink-0 text-black/50 transition-transform duration-200 ${
              formOpen ? "rotate-180" : ""
            }`}
          />
        </button>

        <div
          className={`grid transition-[grid-template-rows] duration-300 ease-out ${
            formOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
          }`}
        >
          <div className="overflow-hidden">
            <div className="border-t border-hairline px-4 pb-4 pt-4">
              <div className="mb-4 flex items-center justify-between">
                <p className="text-xs text-black/50">
                  {editId
                    ? "Editando un presupuesto guardado."
                    : "Rellena los datos del nuevo presupuesto."}
                </p>
                {(editId || presupuestos.length > 0) && (
                  <button
                    type="button"
                    onClick={nuevo}
                    className={btn({ variant: "secondary", size: "sm" })}
                  >
                    + Nuevo presupuesto
                  </button>
                )}
              </div>

              <PresupuestoForm
                key={formKey}
                leadId={leadId}
                accesosDefault={accesosDefault}
                datosCliente={datosCliente}
                initial={initial}
                initialFechaMudanza={initialFecha}
                presupuestoId={editId}
                onSaved={onSaved}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
