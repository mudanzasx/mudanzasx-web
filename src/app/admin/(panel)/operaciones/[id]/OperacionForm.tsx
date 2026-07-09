"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ESTADOS_OPERATIVOS } from "@/lib/operaciones";
import { btn } from "@/components/ui/button";
import { fieldClass, labelClass } from "@/components/admin/LeadFields";
import { guardarOperacion, type GuardarOperacionInput } from "./actions";

export type OperacionInicial = GuardarOperacionInput;

export type VehiculoOpcion = { id: string; tipo: string | null };
export type OperarioOpcion = {
  id: string;
  nombre: string | null;
  rol: string | null;
};

// Resto de operaciones con fecha, para avisar de solapes (no bloquea).
export type OtraOperacion = {
  id: string;
  fecha: string | null;
  vehiculo_id: string | null;
  operarios_ids: string[];
  cliente: string;
};

export default function OperacionForm({
  id,
  inicial,
  vehiculos,
  operarios,
  otras,
}: {
  id: string;
  inicial: OperacionInicial;
  vehiculos: VehiculoOpcion[];
  operarios: OperarioOpcion[];
  otras: OtraOperacion[];
}) {
  const router = useRouter();
  const [f, setF] = useState<OperacionInicial>(inicial);
  const [pending, startTransition] = useTransition();
  const [mensaje, setMensaje] = useState<
    { tipo: "ok" | "error"; texto: string } | null
  >(null);

  // Reinicializa si el servidor devuelve otros valores (tras guardar/recargar).
  const [snapshot, setSnapshot] = useState<OperacionInicial>(inicial);
  const servidorCambio =
    inicial.fecha !== snapshot.fecha ||
    inicial.hora !== snapshot.hora ||
    inicial.vehiculo_id !== snapshot.vehiculo_id ||
    inicial.estado_operativo !== snapshot.estado_operativo ||
    inicial.notas !== snapshot.notas ||
    inicial.operarios_ids.join(",") !== snapshot.operarios_ids.join(",");
  if (servidorCambio) {
    setSnapshot(inicial);
    setF(inicial);
    setMensaje(null);
  }

  const sinCambios =
    f.fecha === inicial.fecha &&
    f.hora === inicial.hora &&
    f.vehiculo_id === inicial.vehiculo_id &&
    f.estado_operativo === inicial.estado_operativo &&
    f.notas === inicial.notas &&
    f.operarios_ids.join(",") === inicial.operarios_ids.join(",");

  function set<K extends keyof OperacionInicial>(
    key: K,
    value: OperacionInicial[K]
  ) {
    setF((prev) => ({ ...prev, [key]: value }));
    setMensaje(null);
  }

  function toggleOperario(operarioId: string) {
    setF((prev) => {
      const yaEsta = prev.operarios_ids.includes(operarioId);
      return {
        ...prev,
        operarios_ids: yaEsta
          ? prev.operarios_ids.filter((x) => x !== operarioId)
          : [...prev.operarios_ids, operarioId],
      };
    });
    setMensaje(null);
  }

  // --- Avisos de solape (contra la fecha y asignación elegidas ahora mismo) ---
  const mismoDia = f.fecha
    ? otras.filter((o) => o.fecha === f.fecha)
    : [];

  const vehiculoSolapa =
    f.vehiculo_id.length > 0
      ? mismoDia.filter((o) => o.vehiculo_id === f.vehiculo_id)
      : [];

  const operariosSolapan = operarios
    .filter((op) => f.operarios_ids.includes(op.id))
    .map((op) => ({
      nombre: op.nombre?.trim() || "operario",
      choques: mismoDia.filter((o) => o.operarios_ids.includes(op.id)),
    }))
    .filter((x) => x.choques.length > 0);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMensaje(null);
    startTransition(async () => {
      const res = await guardarOperacion(id, f);
      if (res.ok) {
        setMensaje({ tipo: "ok", texto: "Operación guardada." });
        router.refresh();
      } else {
        setMensaje({ tipo: "error", texto: res.error });
      }
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-card border border-hairline p-5"
    >
      <h2 className="mb-4 text-xs font-medium uppercase tracking-wide text-black/50">
        Planificación
      </h2>

      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="fecha" className={labelClass}>
              Fecha
            </label>
            <input
              id="fecha"
              type="date"
              value={f.fecha}
              onChange={(e) => set("fecha", e.target.value)}
              className={fieldClass}
            />
          </div>
          <div>
            <label htmlFor="hora" className={labelClass}>
              Hora
            </label>
            <input
              id="hora"
              type="time"
              value={f.hora}
              onChange={(e) => set("hora", e.target.value)}
              className={fieldClass}
            />
          </div>
        </div>

        <div>
          <label htmlFor="vehiculo" className={labelClass}>
            Vehículo
          </label>
          <select
            id="vehiculo"
            value={f.vehiculo_id}
            onChange={(e) => set("vehiculo_id", e.target.value)}
            className={`${fieldClass} appearance-none`}
          >
            <option value="">— Sin vehículo —</option>
            {vehiculos.map((v) => (
              <option key={v.id} value={v.id}>
                {v.tipo?.trim() || "(sin tipo)"}
              </option>
            ))}
          </select>
        </div>

        <div>
          <span className={labelClass}>Operarios</span>
          {operarios.length === 0 ? (
            <p className="mt-1.5 text-sm text-black/40">
              No hay operarios registrados.
            </p>
          ) : (
            <div className="mt-1.5 flex flex-col gap-1.5 rounded-card bg-gris p-3">
              {operarios.map((op) => (
                <label
                  key={op.id}
                  className="flex items-center gap-2 text-sm"
                >
                  <input
                    type="checkbox"
                    checked={f.operarios_ids.includes(op.id)}
                    onChange={() => toggleOperario(op.id)}
                    className="h-4 w-4 accent-black"
                  />
                  <span>{op.nombre?.trim() || "Operario"}</span>
                  {op.rol?.trim() && (
                    <span className="text-black/40">· {op.rol.trim()}</span>
                  )}
                </label>
              ))}
            </div>
          )}
        </div>

        <div>
          <label htmlFor="estado" className={labelClass}>
            Estado operativo
          </label>
          <select
            id="estado"
            value={f.estado_operativo}
            onChange={(e) => set("estado_operativo", e.target.value)}
            className={`${fieldClass} appearance-none`}
          >
            {ESTADOS_OPERATIVOS.map((e) => (
              <option key={e} value={e}>
                {e}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="notas" className={labelClass}>
            Notas
          </label>
          <textarea
            id="notas"
            value={f.notas}
            onChange={(e) => set("notas", e.target.value)}
            rows={4}
            placeholder="Instrucciones para el equipo, incidencias…"
            className={`${fieldClass} resize-y`}
          />
        </div>

        {/* Avisos de solape: informativos, no impiden guardar */}
        {(vehiculoSolapa.length > 0 || operariosSolapan.length > 0) && (
          <div className="rounded-card border border-hairline bg-gris px-3 py-2.5 text-sm">
            {vehiculoSolapa.length > 0 && (
              <p className="text-black/80">
                <strong className="font-semibold">Atención:</strong> este
                vehículo ya tiene otra operación este día
                {" ("}
                {vehiculoSolapa.map((o) => o.cliente).join(", ")}
                {")."}
              </p>
            )}
            {operariosSolapan.map((x) => (
              <p key={x.nombre} className="mt-1 text-black/80 first:mt-0">
                <strong className="font-semibold">Atención:</strong> {x.nombre}{" "}
                ya está asignado a otra operación este día
                {" ("}
                {x.choques.map((o) => o.cliente).join(", ")}
                {")."}
              </p>
            ))}
          </div>
        )}
      </div>

      <div className="mt-6 flex items-center gap-4">
        <button
          type="submit"
          disabled={pending || sinCambios}
          className={btn({ variant: "primary", size: "md" })}
        >
          {pending ? "Guardando…" : "Guardar"}
        </button>
        {mensaje && (
          <span
            role="status"
            className={`text-sm ${
              mensaje.tipo === "ok" ? "text-black/60" : "text-red-600"
            }`}
          >
            {mensaje.texto}
          </span>
        )}
      </div>
    </form>
  );
}
