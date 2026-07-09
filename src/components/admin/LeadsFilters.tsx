"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ESTADOS_COMERCIALES } from "@/lib/leads";
import { field } from "@/components/ui/field";

const fieldClass = field();

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

  // Filtrado en vivo: al dejar de teclear (~350ms) aplicamos la búsqueda sin
  // pulsar Enter, para que se comporte como el <select> instantáneo. Evitamos
  // navegar en el montaje inicial o si el texto ya coincide con la `q` actual.
  useEffect(() => {
    if (texto.trim() === q.trim()) return;
    const t = setTimeout(() => aplicar({ q: texto }), 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [texto]);

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
