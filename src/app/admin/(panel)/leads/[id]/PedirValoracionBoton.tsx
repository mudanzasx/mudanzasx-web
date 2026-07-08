"use client";

import { useState, useTransition } from "react";
import { btn } from "@/components/ui/button";
import { pedirValoracion } from "./emailActions";

// Botón para pedir al cliente que valore el servicio (reseña de Google). Pensado
// sobre todo para leads "Finalizado", pero disponible en general. Muestra el
// resultado sin romper la página.
export default function PedirValoracionBoton({ leadId }: { leadId: string }) {
  const [enviando, start] = useTransition();
  const [msg, setMsg] = useState<{ ok: boolean; texto: string } | null>(null);

  function enviar() {
    setMsg(null);
    start(async () => {
      const res = await pedirValoracion(leadId);
      setMsg(
        res.ok
          ? { ok: true, texto: `Valoración solicitada a ${res.email}` }
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
        className={btn({ variant: "secondary", size: "sm" })}
      >
        {enviando ? "Enviando…" : "Pedir valoración"}
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
