// Lógica pura para comparar costos de compra (sin React ni red).
import { redondear } from './filtros';

// Si el costo ingresado cambia tanto o más que esto frente a la última compra,
// se pide confirmación (ayuda a detectar errores de digitación como Q550 en vez de Q55).
export const UMBRAL_VARIACION_PCT = 20;

const redondearA = (n, decimales) => {
  const f = 10 ** decimales;
  return Math.round((Number(n) + Number.EPSILON) * f) / f;
};

// Variación porcentual de un costo nuevo frente a uno de referencia (null si no se puede calcular)
export function variacionPorcentual(nuevo, referencia) {
  const n = Number(nuevo);
  const r = Number(referencia);
  if (!Number.isFinite(n) || !Number.isFinite(r) || r <= 0) return null;
  return redondearA(((n - r) / r) * 100, 1);
}

// Convierte un costo por unidad base al costo de la presentación que se está comprando
// (por ejemplo, de Q0.70 por unidad a Q70.00 por caja de 100).
export function costoEnPresentacion(costoUnitario, producto, modo) {
  if (modo === 'secundario' && producto?.unidad_secundaria_cantidad) {
    return redondear(Number(costoUnitario) * producto.unidad_secundaria_cantidad);
  }
  return redondear(costoUnitario);
}

export const superaUmbral = (pct) => pct != null && Math.abs(pct) >= UMBRAL_VARIACION_PCT;

// Texto de una variación: "▲ +9.1%", "▼ −4.2%" o "= 0%"
export function textoVariacion(pct) {
  if (pct == null) return '—';
  if (pct === 0) return '= 0%';
  return `${pct > 0 ? '▲ +' : '▼ −'}${Math.abs(pct).toFixed(1)}%`;
}

// Un costo que SUBE es malo (rojo); uno que BAJA es bueno (verde)
export function claseVariacion(pct) {
  if (pct == null || pct === 0) return 'bg-gray-100 text-gray-600';
  return pct > 0 ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800';
}