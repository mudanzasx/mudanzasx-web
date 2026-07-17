// Ondas de marca: arcos concéntricos con UN SOLO origen, estáticos y de peso
// cero (SVG inline). Especificación de marca (compartida por Manifiesto y el
// formulario, de ahí este componente único):
//  · un único centro (originX/originY);
//  · espaciado NO uniforme: cada radio ≈ factor× el anterior (1,35 por defecto),
//    juntas cerca del origen y cada vez más separadas (parecen una onda, no una
//    diana);
//  · opacidad decreciente hacia fuera (opacityStart → opacityEnd);
//  · trazo fino y uniforme con vector-effect="non-scaling-stroke", sin relleno,
//    sin desenfoque;
//  · decorativas: aria-hidden y pointer-events none (no capturan clics).
// Lo que varía entre secciones se pasa por props (color, origen, viewBox,
// encuadre, radio base y opacidad); el resto tiene valores por defecto comunes.

type OndasConcentricasProps = {
  viewBox: string;
  originX: number;
  originY: number;
  baseRadius: number;
  stroke: string; // "#ffffff" sobre negro · "#000000" sobre claro
  opacityStart: number;
  opacityEnd?: number;
  count?: number;
  factor?: number;
  strokeWidth?: number;
  preserveAspectRatio?: string;
  className?: string;
};

export default function OndasConcentricas({
  viewBox,
  originX,
  originY,
  baseRadius,
  stroke,
  opacityStart,
  opacityEnd = 0.02,
  count = 10,
  factor = 1.35,
  strokeWidth = 1.25,
  preserveAspectRatio = "xMidYMid slice",
  className = "pointer-events-none absolute inset-0 h-full w-full",
}: OndasConcentricasProps) {
  const arcos = Array.from({ length: count }, (_, i) => ({
    r: Math.round(baseRadius * Math.pow(factor, i)),
    opacity:
      Math.round(
        (opacityStart - ((opacityStart - opacityEnd) * i) / (count - 1)) * 1000
      ) / 1000,
  }));

  return (
    <svg
      aria-hidden="true"
      className={className}
      viewBox={viewBox}
      preserveAspectRatio={preserveAspectRatio}
    >
      {arcos.map((a, i) => (
        <circle
          key={i}
          cx={originX}
          cy={originY}
          r={a.r}
          fill="none"
          stroke={stroke}
          strokeOpacity={a.opacity}
          strokeWidth={strokeWidth}
          vectorEffect="non-scaling-stroke"
        />
      ))}
    </svg>
  );
}
