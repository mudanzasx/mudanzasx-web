// Banda de manifiesto: interrupción deliberada en negro dentro de la zebra
// gris/blanca de la landing. Fondo negro, texto blanco y, detrás, un patrón
// estático de ondas concéntricas (SVG inline, peso cero, nítido y escalable).
//
// Las ondas nacen en el borde derecho a media altura y se expanden hacia la
// izquierda cruzando la banda por detrás del texto. El espaciado NO es
// uniforme (cada radio ≈ 1,35× el anterior): juntas cerca del origen y cada
// vez más separadas hacia fuera, para que parezcan una onda y no una diana.
// La opacidad se interpola del arco interior (~18%) al exterior (~2%).

// Origen de las ondas dentro del viewBox: borde derecho, media altura.
const ORIGEN_X = 1200;
const ORIGEN_Y = 250;

// 10 arcos: radio geométrico (×1,35) y opacidad interpolada 0.18 → 0.02.
const ARCOS = Array.from({ length: 10 }, (_, i) => ({
  r: Math.round(95 * Math.pow(1.35, i)),
  opacity: Math.round((0.18 - (0.16 * i) / 9) * 1000) / 1000,
}));

export default function Manifiesto() {
  return (
    <section className="relative w-full overflow-hidden bg-black">
      {/* Ondas de marca: estáticas, monocromas, detrás del texto y sin capturar
          clics. preserveAspectRatio="xMaxYMid slice" ancla el origen al borde
          derecho a media altura en cualquier tamaño; overflow-hidden de la banda
          recorta los arcos limpiamente en los bordes. El trazo se mantiene fino
          y constante con vector-effect="non-scaling-stroke". */}
      <svg
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 h-full w-full"
        viewBox="0 0 1200 500"
        preserveAspectRatio="xMaxYMid slice"
      >
        {ARCOS.map((a, i) => (
          <circle
            key={i}
            cx={ORIGEN_X}
            cy={ORIGEN_Y}
            r={a.r}
            fill="none"
            stroke="#ffffff"
            strokeOpacity={a.opacity}
            strokeWidth={1.25}
            vectorEffect="non-scaling-stroke"
          />
        ))}
      </svg>

      {/* Texto alineado a la izquierda: coherente con los titulares de la web
          (hero y secciones van a la izquierda) y, además, queda sobre la zona
          izquierda donde los arcos son más tenues y espaciados, así el titular
          se lee perfectamente. */}
      <div className="relative z-10 mx-auto max-w-[1200px] px-6 py-16 md:py-28">
        <h2 className="max-w-3xl text-[clamp(1.75rem,3.5vw,2.5rem)] font-medium leading-tight tracking-[-0.02em] text-white">
          Cada mudanza se calcula. Ninguna se improvisa.
        </h2>
        <p className="mt-4 max-w-xl text-sm leading-relaxed text-white/70 md:text-base">
          Volumen, distancia, accesos y equipo. Precio cerrado antes de reservar.
        </p>
      </div>
    </section>
  );
}
