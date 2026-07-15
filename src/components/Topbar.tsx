export default function Topbar() {
  return (
    <div className="bg-black text-white">
      {/* Barra ultrafina: tipografía 11px (12px en escritorio) y padding
          vertical mínimo. Altura ~26px móvil / ~32px escritorio. */}
      <p className="mx-auto max-w-[1200px] px-6 py-1.5 text-center text-[11px] leading-tight tracking-tight text-white/90 md:py-2 md:text-xs">
        5% de descuento por pago anticipado
      </p>
    </div>
  );
}
