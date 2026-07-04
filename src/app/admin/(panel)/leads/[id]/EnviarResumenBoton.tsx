"use client";

import { useState, useTransition } from "react";
import { enviarResumenPresupuesto } from "./emailActions";

// Botón para enviar al cliente el email de resumen del presupuesto. Muestra un
// mensaje claro (éxito o error) sin romper la página.
export default function EnviarResumenBoton({
  presupuestoId,
}: {
  presupuestoId: string;
}) {
  const [enviando, start] = useTransition();
  const [msg, setMsg] = useState<{ ok: boolean; texto: string } | null>(null);

  function enviar() {
    setMsg(null);
    start(async () => {
      const res = await enviarResumenPresupuesto(presupuestoId);
      setMsg(
        res.ok
          ? { ok: true, texto: `Resumen enviado a ${res.email}` }
          : { ok: false, texto: res.error }
      );
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <button
        type="button"
        onClick={enviar}
        disabled={enviando}
        className="rounded-full border border-black/20 px-3 py-2 text-xs font-medium transition-colors hover:bg-white disabled:opacity-40"
      >
        {enviando ? "Enviando…" : "Enviar resumen por email"}
      </button>
      {msg && (
        <span
          role="status"
          className={`text-xs ${msg.ok ? "text-emerald-700" : "text-red-600"}`}
        >
          {msg.texto}
        </span>
      )}
    </div>
  );
}
