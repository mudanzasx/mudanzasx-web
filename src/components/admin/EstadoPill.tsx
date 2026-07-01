// Pastilla sobria para el estado comercial: texto sobre gris, sin color chillón.
export default function EstadoPill({ estado }: { estado: string | null }) {
  const texto = (estado ?? "").trim() || "—";
  return (
    <span className="inline-block whitespace-nowrap rounded-full bg-gris px-2.5 py-1 text-xs font-medium text-black">
      {texto}
    </span>
  );
}
