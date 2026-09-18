import Svg, { Path } from 'react-native-svg';

interface Point {
  x: number;
  y: number;
}

interface PathTrailProps {
  width: number;
  height: number;
  /** Centros de los nodos, de arriba abajo. */
  points: readonly Point[];
  /** Cuántos tramos (entre nodos consecutivos) ya se recorrieron. */
  completedSegments: number;
  trackColor: string;
  doneColor: string;
}

const STROKE = 14;

/** Curva suave entre dos nodos: sale vertical de uno y entra vertical al otro. */
function segment(from: Point, to: Point): string {
  const midY = (from.y + to.y) / 2;
  return `C ${from.x} ${midY}, ${to.x} ${midY}, ${to.x} ${to.y}`;
}

function buildPath(points: readonly Point[]): string {
  const [first, ...rest] = points;
  if (!first) return '';
  let d = `M ${first.x} ${first.y}`;
  let previous = first;
  for (const point of rest) {
    d += ` ${segment(previous, point)}`;
    previous = point;
  }
  return d;
}

/**
 * Carril serpenteante que une los nodos del camino (Diseno Nuevo/ruta). Se
 * calcula a partir de las posiciones reales porque el número de lecciones
 * viene del backend.
 */
export function PathTrail({ width, height, points, completedSegments, trackColor, doneColor }: PathTrailProps) {
  if (points.length < 2 || width === 0) return null;

  const done = points.slice(0, Math.min(points.length, completedSegments + 1));

  return (
    <Svg
      width={width}
      height={height}
      style={{ position: 'absolute', top: 0, left: 0 }}
      pointerEvents="none"
    >
      <Path
        d={buildPath(points)}
        stroke={trackColor}
        strokeWidth={STROKE}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      {done.length >= 2 ? (
        <Path
          d={buildPath(done)}
          stroke={doneColor}
          strokeOpacity={0.6}
          strokeWidth={STROKE}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      ) : null}
    </Svg>
  );
}
