import { useId } from 'react';

// Barra de filtros reutilizable (Historial y Movimientos por Producto).
// Dibuja los campos que reciba: búsqueda de texto, listas desplegables y rango de fechas.
//
//  busqueda: { valor, onChange, placeholder, etiqueta }
//  selects:  [{ clave, etiqueta, valor, onChange, opciones: [{ valor, texto }] }]
//  fechas:   { desde, hasta, onDesde, onHasta }
//  hayFiltros / onLimpiar: botón "Limpiar filtros"
//  error: mensaje de validación;  resumen: texto con el conteo de resultados
export default function BarraFiltros({ busqueda, selects = [], fechas, hayFiltros, onLimpiar, error, resumen, cargando }) {
  const base = useId();

  return (
    <div className="px-5 py-4 border-b space-y-3">
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '0.75rem' }}>
        {busqueda && (
          <div style={{ gridColumn: 'span 2' }}>
            <label htmlFor={`${base}-q`} className="text-xs font-bold text-gray-500">{busqueda.etiqueta || 'Buscar'}</label>
            <input
              id={`${base}-q`}
              type="text"
              value={busqueda.valor}
              onChange={(e) => busqueda.onChange(e.target.value)}
              placeholder={busqueda.placeholder}
              className="mt-1"
              autoComplete="off"
            />
          </div>
        )}

        {selects.map((s) => (
          <div key={s.clave}>
            <label htmlFor={`${base}-${s.clave}`} className="text-xs font-bold text-gray-500">{s.etiqueta}</label>
            <select id={`${base}-${s.clave}`} value={s.valor} onChange={(e) => s.onChange(e.target.value)} className="mt-1">
              {s.opciones.map((o) => <option key={o.valor} value={o.valor}>{o.texto}</option>)}
            </select>
          </div>
        ))}

        {fechas && (
          <>
            <div>
              <label htmlFor={`${base}-desde`} className="text-xs font-bold text-gray-500">Desde</label>
              <input id={`${base}-desde`} type="date" value={fechas.desde} max={fechas.hasta || undefined} onChange={(e) => fechas.onDesde(e.target.value)} className="mt-1" />
            </div>
            <div>
              <label htmlFor={`${base}-hasta`} className="text-xs font-bold text-gray-500">Hasta</label>
              <input id={`${base}-hasta`} type="date" value={fechas.hasta} min={fechas.desde || undefined} onChange={(e) => fechas.onHasta(e.target.value)} className="mt-1" />
            </div>
          </>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-gray-400">
          {error ? <span className="text-red-600 font-semibold">{error}</span> : (cargando ? 'Buscando...' : resumen)}
        </p>
        {hayFiltros && (
          <button type="button" onClick={onLimpiar} className="text-xs font-bold text-blue-600 hover:text-blue-700 transition">
            Limpiar filtros
          </button>
        )}
      </div>
    </div>
  );
}