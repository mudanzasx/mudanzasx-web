"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ESTADOS_COMERCIALES } from "@/lib/leads";
import { Card, Text, Check, fieldClass, labelClass } from "@/components/admin/LeadFields";
import { btn } from "@/components/ui/button";
import { guardarLead, type GuardarLeadInput } from "./actions";

export type LeadInicial = GuardarLeadInput;

// Ficha editable completa del cliente. Un único "Guardar" persiste contacto,
// origen, destino, estado comercial y notas mediante la Server Action.
export default function EditLeadForm({
  id,
  inicial,
}: {
  id: string;
  inicial: LeadInicial;
}) {
  const router = useRouter();
  const [f, setF] = useState<LeadInicial>(inicial);
  const [pending, startTransition] = useTransition();
  const [mensaje, setMensaje] = useState<
    { tipo: "ok" | "error"; texto: string } | null
  >(null);

  // Fuente de verdad = el servidor. Si el lead recién leído (props `inicial`)
  // difiere del último snapshot que sincronizamos, reinicializamos el formulario
  // con esos valores. Así, tras un pago, cuando el webhook deja el estado en
  // 'Reservado' en la base de datos y la página se recarga, el desplegable
  // refleja el valor real igual que la etiqueta de arriba (no un valor cacheado).
  const [snapshot, setSnapshot] = useState<LeadInicial>(inicial);
  const servidorCambio = (Object.keys(inicial) as (keyof LeadInicial)[]).some(
    (k) => inicial[k] !== snapshot[k]
  );
  if (servidorCambio) {
    setSnapshot(inicial);
    setF(inicial);
    setMensaje(null);
  }

  const sinCambios = (Object.keys(inicial) as (keyof LeadInicial)[]).every(
    (k) => f[k] === inicial[k]
  );

  function set<K extends keyof LeadInicial>(key: K, value: LeadInicial[K]) {
    setF((prev) => ({ ...prev, [key]: value }));
    setMensaje(null);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMensaje(null);
    startTransition(async () => {
      const res = await guardarLead(id, f);
      if (res.ok) {
        setMensaje({ tipo: "ok", texto: "Ficha guardada." });
        router.refresh();
      } else {
        setMensaje({ tipo: "error", texto: res.error });
      }
    });
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <Card title="Contacto">
          <Text label="Nombre" value={f.nombre} onChange={(v) => set("nombre", v)} />
          <Text label="Teléfono" value={f.telefono} onChange={(v) => set("telefono", v)} />
          <Text label="Email" type="email" value={f.email} onChange={(v) => set("email", v)} />
        </Card>

        <Card title="Origen">
          <Text
            label="Dirección"
            value={f.origen_direccion}
            onChange={(v) => set("origen_direccion", v)}
          />
          <Text
            label="Planta"
            value={f.origen_planta}
            onChange={(v) => set("origen_planta", v)}
          />
          <Check
            label="Ascensor en origen"
            checked={f.origen_ascensor}
            onChange={(v) => set("origen_ascensor", v)}
          />
        </Card>

        <Card title="Destino">
          <Text
            label="Dirección"
            value={f.destino_direccion}
            onChange={(v) => set("destino_direccion", v)}
          />
          <Text
            label="Planta"
            value={f.destino_planta}
            onChange={(v) => set("destino_planta", v)}
          />
          <Check
            label="Ascensor en destino"
            checked={f.destino_ascensor}
            onChange={(v) => set("destino_ascensor", v)}
          />
        </Card>

        <Card title="Gestión">
          <div>
            <label htmlFor="estado_comercial" className={labelClass}>
              Estado comercial
            </label>
            <select
              id="estado_comercial"
              value={f.estado_comercial}
              onChange={(e) => set("estado_comercial", e.target.value)}
              className={`${fieldClass} appearance-none`}
            >
              {ESTADOS_COMERCIALES.map((e) => (
                <option key={e} value={e}>
                  {e}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="notas" className={labelClass}>
              Notas internas
            </label>
            <textarea
              id="notas"
              value={f.notas}
              onChange={(e) => set("notas", e.target.value)}
              rows={5}
              placeholder="Anotaciones del equipo sobre este cliente…"
              className={`${fieldClass} resize-y`}
            />
          </div>
        </Card>
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
