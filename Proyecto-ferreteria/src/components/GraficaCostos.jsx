import { formatQ } from '../utils/format';

// Gráfica de línea del costo unitario a lo largo del tiempo (SVG, sin librerías).
// puntos: [{ fecha, costo }] ordenados de la compra más antigua a la más reciente.
export default function GraficaCostos({ puntos }) {
  if (!puntos || puntos.length === 0) return null;

  const W = 640, H = 200, izq = 56, der = 16, arr = 16, aba = 34;
  const costos = puntos.map((p) => p.costo);
  let min = Math.min(...costos);
  let max = Math.max(...costos);
  if (min === max) { min -= 1; max += 1; }          // línea plana: se da algo de aire para que se vea
  const margen = (max - min) * 0.15;
  min = Math.max(0, min - margen);
  max = max + margen;

  const x = (i) => (puntos.length === 1 ? (izq + W - der) / 2 : izq + (i * (W - izq - der)) / (puntos.length - 1));
  const y = (c) => arr + ((max - c) * (H - arr - aba)) / (max - min);
  const linea = puntos.map((p, i) => `${x(i)},${y(p.costo)}`).join(' ');
  const fecha = (f) => new Date(f).toLocaleDateString('es-GT', { day: '2-digit', month: 'short' });

  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Gráfica de la variación del costo de compra" style={{ width: '100%', height: 'auto' }}>
      {[0, 0.5, 1].map((t) => {
        const valor = min + (max - min) * t;
        return (
          <g key={t}>
            <line x1={izq} x2={W - der} y1={y(valor)} y2={y(valor)} style={{ stroke: 'var(--surface-3)', strokeWidth: 1 }} />
            <text x={izq - 8} y={y(valor) + 4} textAnchor="end" fontSize="11" style={{ fill: 'var(--text-faint)' }}>Q{formatQ(valor)}</text>
          </g>
        );
      })}
      {puntos.length > 1 && <polyline points={linea} fill="none" style={{ stroke: 'var(--amber)', strokeWidth: 2.5 }} strokeLinejoin="round" />}
      {puntos.map((p, i) => (
        <circle key={i} cx={x(i)} cy={y(p.costo)} r="4" style={{ fill: 'var(--amber)', stroke: 'var(--surface)', strokeWidth: 2 }}>
          <title>{`${fecha(p.fecha)}: Q${formatQ(p.costo)}`}</title>
        </circle>
      ))}
      <text x={x(0)} y={H - 10} textAnchor={puntos.length === 1 ? 'middle' : 'start'} fontSize="11" style={{ fill: 'var(--text-faint)' }}>{fecha(puntos[0].fecha)}</text>
      {puntos.length > 1 && (
        <text x={x(puntos.length - 1)} y={H - 10} textAnchor="end" fontSize="11" style={{ fill: 'var(--text-faint)' }}>{fecha(puntos[puntos.length - 1].fecha)}</text>
      )}
    </svg>
  );
}