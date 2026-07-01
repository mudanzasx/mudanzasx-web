"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ESTADOS_COMERCIALES } from "@/lib/leads";

const fieldClass =
  "w-full rounded-lg bg-gris px-4 py-2.5 text-sm text-black placeholder-black/40 outline-none border border-transparent transition-colors duration-150 focus:border-black";

// Controles de búsqueda/filtro. Empujan a query params y el servidor consulta.
export default function LeadsFilters({
  q,
  estado,
}: {
  q: string;
  estado: string;
}) {
  const router = useRouter();
  const [texto, setTexto] = useState(q);

  function aplicar(next: { q?: string; estado?: string }) {
    const params = new URLSearchParams();
    const nq = next.q !== undefined ? next.q : texto;
    const ne = next.estado !== undefined ? next.estado : estado;
    if (nq.trim()) params.set("q", nq.trim());
    if (ne) params.set("estado", ne);
    const qs = params.toString();
    router.push(qs ? `/admin?${qs}` : "/admin");
  }

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <form
        className="flex-1"
        onSubmit={(e) => {
          e.preventDefault();
          aplicar({ q: texto });
        }}
      >
        <input
          type="search"
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          placeholder="Buscar por nombre o teléfono…"
          aria-label="Buscar por nombre o teléfono"
          className={fieldClass}
        />
      </form>

      <select
        value={estado}
        onChange={(e) => aplicar({ estado: e.target.value })}
        aria-label="Filtrar por estado comercial"
        className={`${fieldClass} appearance-none sm:w-56`}
      >
        <option value="">Todos los estados</option>
        {ESTADOS_COMERCIALES.map((e) => (
          <option key={e} value={e}>
            {e}
          </option>
        ))}
      </select>
    </div>
  );
}
