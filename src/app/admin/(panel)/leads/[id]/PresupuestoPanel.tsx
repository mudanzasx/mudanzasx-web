"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatPrecio, formatFechaHora } from "@/lib/leads";
import EstadoPill from "@/components/admin/EstadoPill";
import PresupuestoForm, {
  type AccesosDefault,
  type DatosCliente,
  type PresupuestoPayload,
} from "./PresupuestoForm";

export type PresupuestoGuardado = {
  id: string;
  creado_en: string | null;
  precio_final: number | null;
  vehiculo: string | null;
  operarios: number | null;
  estado: string | null;
  detalle_objetos: PresupuestoPayload | null;
};

export default function PresupuestoPanel({
  leadId,
  accesosDefault,
  datosCliente,
  presupuestos,
}: {
  leadId: string;
  accesosDefault: AccesosDefault;
  datosCliente: DatosCliente;
  presupuestos: PresupuestoGuardado[];
}) {
  const router = useRouter();
  const [editId, setEditId] = useState<string | null>(null);
  const [initial, setInitial] = useState<PresupuestoPayload | null>(null);
  // Cambia con cada carga/nuevo para forzar el remonte del formulario.
  const [formKey, setFormKey] = useState(0);

  function abrir(p: PresupuestoGuardado) {
    // Solo se puede reabrir si el snapshot es del formato nuevo (v2).
    if (!p.detalle_objetos || p.detalle_objetos.version == null) return;
    setEditId(p.id);
    setInitial(p.detalle_objetos);
    setFormKey((k) => k + 1);
  }

  function nuevo() {
    setEditId(null);
    setInitial(null);
    setFormKey((k) => k + 1);
  }

  function onSaved() {
    // La lista se recarga desde el servidor; el formulario mantiene su estado.
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
              <button
                key={p.id}
                type="button"
                onClick={() => abrir(p)}
                disabled={!puede}
                className={`flex items-center justify-between gap-3 rounded-lg border px-3 py-2 text-left text-sm transition-colors ${
                  activo
                    ? "border-black bg-gris"
                    : "border-black/10 hover:bg-gris disabled:cursor-default disabled:hover:bg-transparent"
                }`}
              >
                <div className="min-w-0">
                  <p className="font-medium tabular-nums">{formatPrecio(p.precio_final)}</p>
                  <p className="text-xs text-black/50">
                    {formatFechaHora(p.creado_en)} · {p.vehiculo ?? "—"} ·{" "}
                    {p.operarios ?? "—"} operarios
                    {!puede && " · (formato antiguo)"}
                  </p>
                </div>
                <EstadoPill estado={p.estado} />
              </button>
            );
          })}
        </div>
      )}

      <div className="flex items-center justify-between">
        <p className="text-xs text-black/50">
          {editId ? "Editando un presupuesto guardado." : "Nuevo presupuesto."}
        </p>
        {(editId || presupuestos.length > 0) && (
          <button
            type="button"
            onClick={nuevo}
            className="rounded-full border border-black/15 px-3 py-1.5 text-xs font-medium hover:bg-gris"
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
        presupuestoId={editId}
        onSaved={onSaved}
      />
    </div>
  );
}
