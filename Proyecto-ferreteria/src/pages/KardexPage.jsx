import { useState, useMemo } from 'react';
import { useKardex } from '../hooks/useKardex';
import { formatQ } from '../utils/format';
import BarraFiltros from '../components/BarraFiltros';
import {
  filtrarProductos, filtrarMovimientos, resumirMovimientos, saldoAlInicio,
  rangoInvalido, hayFiltros as hayAlgunFiltro, redondear
} from '../utils/filtros';

const FILTROS_VACIOS = { q: '', tipo: '', desde: '', hasta: '' };

export default function KardexPage({ productos, token }) {
  const { productoSeleccionado, datosKardex, cargando, error, consultarKardex } = useKardex(token);

  // Buscador para encontrar el producto entre muchos
  const [buscaProducto, setBuscaProducto] = useState('');
  // Filtros sobre los movimientos del producto elegido
  const [filtros, setFiltros] = useState(FILTROS_VACIOS);
  const actualizar = (campo, valor) => setFiltros((f) => ({ ...f, [campo]: valor }));

  const productosVisibles = useMemo(() => filtrarProductos(productos, buscaProducto), [productos, buscaProducto]);

  const elegirProducto = (id) => {
    setFiltros(FILTROS_VACIOS); // al cambiar de producto, los filtros del anterior ya no aplican
    consultarKardex(id);
  };

  const rangoMalo = rangoInvalido(filtros.desde, filtros.hasta);
  const movimientos = datosKardex?.movimientos || [];
  const visibles = useMemo(
    () => (rangoMalo ? [] : filtrarMovimientos(movimientos, filtros)),
    [movimientos, filtros, rangoMalo]
  );
  const totales = resumirMovimientos(visibles);
  const filtrado = hayAlgunFiltro(filtros);
  // La fila de "saldo inicial" solo tiene sentido cuando no se filtra por tipo ni por referencia
  const mostrarSaldoInicial = !filtros.tipo && !filtros.q.trim() && !rangoMalo;
  const saldoDeArranque = datosKardex ? saldoAlInicio(movimientos, datosKardex.saldoInicial, filtros.desde) : 0;

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Movimientos por Producto <span className="text-sm font-normal text-gray-400">(Kardex)</span></h2>
        <p className="text-sm text-gray-400 mt-0.5">Historial de entradas y salidas de un producto, con su saldo acumulado.</p>
      </div>

      <div className="bg-white p-4 rounded-xl border shadow-sm max-w-md space-y-3">
        <div>
          <label htmlFor="kardex-busca" className="text-xs font-bold text-gray-500">Buscar producto</label>
          <input
            id="kardex-busca"
            type="text"
            value={buscaProducto}
            onChange={(e) => setBuscaProducto(e.target.value)}
            placeholder="Escribe el nombre, código o marca..."
            className="mt-1"
            autoComplete="off"
          />
        </div>
        <div>
          <label htmlFor="kardex-producto" className="text-xs font-bold text-gray-500">Selecciona un producto</label>
          <select id="kardex-producto" value={productoSeleccionado} onChange={(e) => elegirProducto(e.target.value)} className="w-full p-2 border rounded bg-gray-50 text-sm mt-1">
            <option value="">{productosVisibles.length === 0 ? 'Ningún producto coincide' : `Seleccionar producto (${productosVisibles.length})`}</option>
            {productosVisibles.map(p => <option key={p.id} value={p.id}>{p.id} — {p.nombre}</option>)}
          </select>
        </div>
      </div>

      {cargando && <p className="text-sm text-gray-400">Cargando kardex...</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}

      {datosKardex && (
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <div className="p-4 border-b flex justify-between items-center flex-wrap gap-2">
            <div>
              <p className="font-bold text-gray-900">{datosKardex.producto.nombre}</p>
              <p className="text-xs text-gray-400">{datosKardex.producto.id}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-400">Existencia actual</p>
              <p className="font-bold text-gray-900">{redondear(datosKardex.producto.stockActual)} uds</p>
            </div>
          </div>

          <BarraFiltros
            busqueda={{ valor: filtros.q, onChange: (v) => actualizar('q', v), placeholder: 'Ej: venta, compra o #12', etiqueta: 'Buscar por referencia' }}
            selects={[{
              clave: 'tipo', etiqueta: 'Movimiento', valor: filtros.tipo, onChange: (v) => actualizar('tipo', v),
              opciones: [{ valor: '', texto: 'Todos' }, { valor: 'Entrada', texto: 'Entradas (compras)' }, { valor: 'Salida', texto: 'Salidas (ventas)' }]
            }]}
            fechas={{ desde: filtros.desde, hasta: filtros.hasta, onDesde: (v) => actualizar('desde', v), onHasta: (v) => actualizar('hasta', v) }}
            hayFiltros={filtrado}
            onLimpiar={() => setFiltros(FILTROS_VACIOS)}
            error={rangoMalo ? 'La fecha "Desde" no puede ser posterior a la fecha "Hasta".' : ''}
            resumen={`Mostrando ${visibles.length} de ${movimientos.length} movimientos · Entradas +${totales.entradas} · Salidas −${totales.salidas}`}
          />

          <table className="w-full text-left text-sm">
            <thead className="bg-gray-100 text-xs font-bold border-b text-gray-600 uppercase tracking-wider">
              <tr>
                <th className="p-3">Fecha</th>
                <th className="p-3">Movimiento</th>
                <th className="p-3">Referencia</th>
                <th className="p-3">Cantidad</th>
                <th className="p-3">Costo / Precio</th>
                <th className="p-3">Saldo</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {mostrarSaldoInicial && (
                <tr className="bg-gray-50">
                  <td className="p-3 text-gray-400" colSpan={5}>
                    {filtros.desde ? `Saldo al inicio del período (antes del ${filtros.desde.split('-').reverse().join('/')})` : 'Saldo inicial (antes del primer movimiento registrado)'}
                  </td>
                  <td className="p-3 font-bold">{redondear(saldoDeArranque)}</td>
                </tr>
              )}
              {movimientos.length === 0 ? (
                <tr><td colSpan={6} className="p-6 text-center text-gray-400">Este producto aún no tiene ventas ni compras registradas.</td></tr>
              ) : visibles.length === 0 ? (
                <tr><td colSpan={6} className="p-6 text-center text-gray-400">Ningún movimiento coincide con los filtros aplicados.</td></tr>
              ) : visibles.map((m, i) => (
                <tr key={i}>
                  <td className="p-3 text-gray-500">{new Date(m.fecha).toLocaleDateString('es-GT')}</td>
                  <td className="p-3">
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${m.tipo === 'Entrada' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{m.tipo}</span>
                  </td>
                  <td className="p-3 text-gray-500">{m.referencia}</td>
                  <td className={`p-3 font-semibold ${m.cantidad >= 0 ? 'text-green-700' : 'text-red-700'}`}>{m.cantidad >= 0 ? '+' : ''}{redondear(m.cantidad)}</td>
                  <td className="p-3 text-gray-500">{m.costoOPrecio == null ? '—' : `Q${formatQ(m.costoOPrecio)}`}</td>
                  <td className="p-3 font-bold text-gray-900">{redondear(m.saldo)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtrado && visibles.length > 0 && (
            <p className="px-4 py-3 text-xs text-gray-400 border-t">El saldo de cada fila es el acumulado real del producto, aunque algunos movimientos estén ocultos por los filtros.</p>
          )}
        </div>
      )}
    </div>
  );
}