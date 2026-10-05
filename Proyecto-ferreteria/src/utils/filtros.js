// Utilidades puras de filtrado y búsqueda (sin React ni red).

// Quita acentos y pasa a minúsculas: "José" y "jose" se consideran iguales al buscar.
export const sinAcentos = (t) =>
  String(t ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

// Redondea a 2 decimales (las cantidades del sistema son DECIMAL(10,2)) y evita
// artefactos de punto flotante como 0.30000000000000004.
export const redondear = (n) => Math.round((Number(n) + Number.EPSILON) * 100) / 100;

// Fecha "AAAA-MM-DD" en la hora local del navegador (la misma que ve el usuario en pantalla).
export function fechaLocalISO(valor) {
  const d = new Date(valor);
  if (Number.isNaN(d.getTime())) return '';
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${mm}-${dd}`;
}

export const rangoInvalido = (desde, hasta) => Boolean(desde && hasta && desde > hasta);

export const hayFiltros = (filtros) =>
  Object.values(filtros).some((v) => v !== '' && v != null);

// Arma el query string ignorando los filtros vacíos.
export function aQueryString(filtros, extra = {}) {
  const params = new URLSearchParams();
  Object.entries({ ...filtros, ...extra }).forEach(([clave, valor]) => {
    if (valor !== '' && valor != null) params.append(clave, String(valor).trim());
  });
  return params.toString();
}

// Filtra la lista de productos por código, nombre o marca.
export function filtrarProductos(productos, texto) {
  const t = sinAcentos(texto).trim();
  if (!t) return productos;
  return productos.filter((p) => sinAcentos(`${p.id} ${p.nombre} ${p.marca || ''}`).includes(t));
}

// Filtra los movimientos del Kardex por tipo, referencia y rango de fechas.
export function filtrarMovimientos(movimientos, { tipo = '', q = '', desde = '', hasta = '' } = {}) {
  const t = sinAcentos(q).trim();
  return movimientos.filter((m) => {
    if (tipo && m.tipo !== tipo) return false;
    if (t && !sinAcentos(m.referencia).includes(t)) return false;
    if (desde || hasta) {
      const f = fechaLocalISO(m.fecha);
      if (desde && f < desde) return false;
      if (hasta && f > hasta) return false;
    }
    return true;
  });
}

// Totales de entradas y salidas de una lista de movimientos.
export function resumirMovimientos(lista) {
  let entradas = 0;
  let salidas = 0;
  lista.forEach((m) => {
    if (m.cantidad >= 0) entradas += m.cantidad;
    else salidas += Math.abs(m.cantidad);
  });
  return { entradas: redondear(entradas), salidas: redondear(salidas) };
}

// Saldo con el que arranca el período filtrado: el saldo del último movimiento
// anterior a la fecha "desde", o el saldo inicial si no hay ninguno antes.
export function saldoAlInicio(movimientos, saldoInicial, desde) {
  if (!desde) return saldoInicial;
  let saldo = saldoInicial;
  for (const m of movimientos) {
    if (fechaLocalISO(m.fecha) < desde) saldo = m.saldo;
    else break;
  }
  return saldo;
}