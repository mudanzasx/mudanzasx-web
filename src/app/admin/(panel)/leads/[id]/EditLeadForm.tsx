"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ESTADOS_COMERCIALES } from "@/lib/leads";
import { guardarLead } from "./actions";

const fieldClass =
  "mt-2 w-full rounded-lg bg-gris px-4 py-3 text-sm text-black placeholder-black/40 outline-none border border-transparent transition-colors duration-150 focus:border-black";

// Edición de estado comercial + notas. Llama a la Server Action guardarLead.
export default function EditLeadForm({
  id,
  estadoInicial,
  notasInicial,
}: {
  id: string;
  estadoInicial: string;
  notasInicial: string;
}) {
  const router = useRouter();
  const [estado, setEstado] = useState(estadoInicial);
  const [notas, setNotas] = useState(notasInicial);
  const [pending, startTransition] = useTransition();
  const [mensaje, setMensaje] = useState<
    { tipo: "ok" | "error"; texto: string } | null
  >(null);

  const sinCambios = estado === estadoInicial && notas === notasInicial;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMensaje(null);
    startTransition(async () => {
      const res = await guardarLead(id, {
        estado_comercial: estado,
        notas,
      });
      if (res.ok) {
        setMensaje({ tipo: "ok", texto: "Cambios guardados." });
        router.refresh();
      } else {
        setMensaje({ tipo: "error", texto: res.error });
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <div>
        <label htmlFor="estado_comercial" className="block text-sm font-medium">
          Estado comercial
        </label>
        <select
          id="estado_comercial"
          value={estado}
          onChange={(e) => setEstado(e.target.value)}
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
        <label htmlFor="notas" className="block text-sm font-medium">
          Notas internas
        </label>
        <textarea
          id="notas"
          value={notas}
          onChange={(e) => setNotas(e.target.value)}
          rows={6}
          placeholder="Anotaciones del equipo sobre este cliente…"
          className={`${fieldClass} resize-y`}
        />
      </div>

      <div className="flex items-center gap-4">
        <button
          type="submit"
          disabled={pending || sinCambios}
          className="rounded-full bg-black px-6 py-3 text-sm font-medium text-white transition-colors duration-150 hover:bg-black/85 disabled:opacity-40"
        >
          {pending ? "Guardando…" : "Guardar"}
        </button>
        {mensaje && (
          <span
            role="status"
            className={`text-sm ${
              mensaje.tipo === "ok" ? "text-black/60" : "text-black"
            }`}
          >
            {mensaje.texto}
          </span>
        )}
      </div>
    </form>
  );
}
