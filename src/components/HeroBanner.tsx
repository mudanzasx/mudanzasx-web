// Banner gráfico del hero (SVG inline, estático, decorativo). Estética
// aeroespacial/técnica monocroma sobre negro: ondas concéntricas + trayectorias
// en abanico que parten de un único origen (el ancla, conceptualmente
// Barcelona). No es imagen: línea finísima a baja opacidad, unos pocos KB, sin
// petición de red y sin penalizar el LCP del hero. Estrictamente blanco/negro.

// Origen de toda la composición: tercio izquierdo, a media altura del viewBox.
const CX = 360;
const CY = 200;

// a) Ondas concéntricas: 10 arcos con el mismo centro, radio geométrico (×1,35)
// —muy juntos cerca del origen, más separados hacia fuera— y opacidad
// interpolada 0.18 → 0.02. Con non-scaling-stroke y viewBox ancho, los mayores
// se salen del encuadre (arcos, no círculos cerrados).
const ARCOS = Array.from({ length: 10 }, (_, i) => ({
  r: Math.round(40 * Math.pow(1.35, i)),
  opacity: Math.round((0.18 - (0.16 * i) / 9) * 1000) / 1000,
}));

// b) Trayectorias: líneas en abanico hacia la derecha, con ángulos y longitudes
// desiguales y no simétricas (unas cruzan casi toda la banda; otras se quedan a
// medio camino). `marca` = remate diminuto en el destino, como en un plano.
const RUTAS = [
  { a: -34, len: 470, marca: true },
  { a: -18, len: 820, marca: false },
  { a: -5, len: 980, marca: true },
  { a: 8, len: 360, marca: false },
  { a: 22, len: 900, marca: true },
  { a: 37, len: 300, marca: false },
].map(({ a, len, marca }) => {
  const rad = (a * Math.PI) / 180;
  return {
    x2: Math.round(CX + len * Math.cos(rad)),
    y2: Math.round(CY + len * Math.sin(rad)),
    marca,
  };
});

// c) Marcas de medición: ticks verticales regulares en el borde inferior, muy
// tenues (escala de un plano técnico). Se intuyen, no se ven.
const TICKS = Array.from({ length: 24 }, (_, i) => 40 + i * 48).filter(
  (x) => x <= 1180,
);

export default function HeroBanner() {
  return (
    <svg
      aria-hidden="true"
      className="pointer-events-none h-full w-full"
      viewBox="0 0 1200 400"
      // xMin ancla el origen (tercio izquierdo) a la izquierda: en anchos
      // estrechos se recorta la derecha, pero el origen y sus arcos/trayectorias
      // siguen viéndose. slice cubre y recorta contra las esquinas redondeadas.
      preserveAspectRatio="xMinYMid slice"
      fill="none"
      stroke="#ffffff"
    >
      {/* a) Ondas concéntricas */}
      {ARCOS.map((arc, i) => (
        <circle
          key={`a${i}`}
          cx={CX}
          cy={CY}
          r={arc.r}
          strokeOpacity={arc.opacity}
          strokeWidth={1}
          vectorEffect="non-scaling-stroke"
        />
      ))}

      {/* b) Trayectorias en abanico desde el origen */}
      {RUTAS.map((r, i) => (
        <line
          key={`r${i}`}
          x1={CX}
          y1={CY}
          x2={r.x2}
          y2={r.y2}
          strokeOpacity={0.16}
          strokeWidth={1}
          vectorEffect="non-scaling-stroke"
        />
      ))}
      {/* Remate diminuto en el destino de algunas rutas (punto, blanco 25%) */}
      {RUTAS.filter((r) => r.marca).map((r, i) => (
        <circle
          key={`m${i}`}
          cx={r.x2}
          cy={r.y2}
          r={2}
          fill="#ffffff"
          fillOpacity={0.25}
          stroke="none"
        />
      ))}

      {/* c) Marcas de medición en el borde inferior, muy sutiles */}
      {TICKS.map((x, i) => (
        <line
          key={`t${i}`}
          x1={x}
          y1={384}
          x2={x}
          y2={372}
          strokeOpacity={0.07}
          strokeWidth={1}
          vectorEffect="non-scaling-stroke"
        />
      ))}

      {/* Ancla del origen: punto blanco sólido (Barcelona, conceptualmente) */}
      <circle
        cx={CX}
        cy={CY}
        r={3}
        fill="#ffffff"
        fillOpacity={0.9}
        stroke="none"
      />
    </svg>
  );
}
