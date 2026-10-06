import { useState, useMemo } from 'react';
import { useCostosProducto } from '../hooks/useCostosProducto';
import { formatQ } from '../utils/format';
import BarraFiltros from '../components/BarraFiltros';
import GraficaCostos from '../components/GraficaCostos';
import { filtrarProductos, rangoInvalido } from '../utils/filtros';
import { textoVariacion, claseVariacion } from '../utils/costos';

const SIN_FECHAS = { desde: '', hasta: '' };

function Tarjeta({ titulo, valor, detalle, color }) {
  return (
    <div className="bg-white p-4 rounded-xl border shadow-sm">
      <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">{titulo}</p>
      <p className={`text-xl font-black mt-1 ${color || 'text-gray-900'}`}>{valor}</p>
      {detalle && <p className="text-[11px] text-gray-400 mt-0.5">{detalle}</p>}
    </div>
  );
}

// Panel exclusivo del administrador: cómo ha variado el costo de compra de cada producto.
export default function CostosPage({ productos, token }) {
  const { datos, cargando, error, consultar } = useCostosProducto({ token });
  const [buscaProducto, setBuscaProducto] = useState('');
  const [productoId, setProductoId] = useState('');
  const [fechas, setFechas] = useState(SIN_FECHAS);

  const productosVisibles = useMemo(() => filtrarProductos(productos, buscaProducto), [productos, buscaProducto]);
  const rangoMalo = rangoInvalido(fechas.desde, fechas.hasta);

  const elegirProducto = (id) => {
    setProductoId(id);
    setFechas(SIN_FECHAS);
    consultar(id);
  };
  const cambiarFecha = (campo, valor) => {
    const nuevas = { ...fechas, [campo]: valor };
    setFechas(nuevas);
    if (!rangoInvalido(nuevas.desde, nuevas.hasta)) consultar(productoId, nuevas);
  };
  const limpiarFechas = () => { setFechas(SIN_FECHAS); consultar(productoId); };

  const r = datos?.resumen;
  const puntos = useMemo(
    () => (datos?.historial || []).slice().reverse().map((h) => ({ fecha: h.fecha, costo: h.costo })),
    [datos]
  );
  const hayFechas = Boolean(fechas.desde || fechas.hasta);

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Variación de Costos de Compra</h2>
        <p className="text-sm text-gray-400 mt-0.5">Cómo ha cambiado lo que pagas por cada producto, compra tras compra.</p>
      </div>

      <div className="bg-white p-4 rounded-xl border shadow-sm max-w-md space-y-3">
        <div>
          <label htmlFor="costos-busca" className="text-xs font-bold text-gray-500">Buscar producto</label>
          <input id="costos-busca" type="text" value={buscaProducto} onChange={(e) => setBuscaProducto(e.target.value)}
            placeholder="Escribe el nombre, código o marca..." className="mt-1" autoComplete="off" />
        </div>
        <div>
          <label htmlFor="costos-producto" className="text-xs font-bold text-gray-500">Selecciona un producto</label>
          <select id="costos-producto" value={productoId} onChange={(e) => elegirProducto(e.target.value)} className="w-full p-2 border rounded bg-gray-50 text-sm mt-1">
            <option value="">{productosVisibles.length === 0 ? 'Ningún producto coincide' : `Seleccionar producto (${productosVisibles.length})`}</option>
            {productosVisibles.map((p) => <option key={p.id} value={p.id}>{p.id} — {p.nombre}</option>)}
          </select>
        </div>
      </div>

      {cargando && !datos && <p className="text-sm text-gray-400">Cargando costos...</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}

      {datos && (
        <div className="space-y-4">
          <div className="flex justify-between items-end flex-wrap gap-2">
            <div>
              <p className="font-bold text-gray-900">{datos.producto.nombre}</p>
              <p className="text-xs text-gray-400">{datos.producto.id} · Precio de venta actual: Q{formatQ(datos.producto.precioVenta)}</p>
            </div>
          </div>

          {r && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '0.75rem' }}>
              <Tarjeta titulo="Último costo" valor={`Q${formatQ(r.ultimo)}`}
                detalle={r.anterior != null ? `Antes: Q${formatQ(r.anterior)}` : 'Única compra en el período'} />
              <Tarjeta titulo="Cambio vs. anterior" valor={textoVariacion(r.variacionUltimaPct)}
                color={r.variacionUltimaPct > 0 ? 'text-red-600' : r.variacionUltimaPct < 0 ? 'text-green-700' : undefined}
                detalle="Última compra frente a la previa" />
              <Tarjeta titulo="Mínimo" valor={`Q${formatQ(r.minimo)}`} detalle="El costo más bajo pagado" />
              <Tarjeta titulo="Máximo" valor={`Q${formatQ(r.maximo)}`} detalle="El costo más alto pagado" />
              <Tarjeta titulo="Promedio" valor={`Q${formatQ(r.promedio)}`} detalle={`Ponderado por cantidad · ${r.compras} compra${r.compras !== 1 ? 's' : ''}`} />
              <Tarjeta titulo="Margen actual" valor={r.margenPct == null ? '—' : `${r.margenPct.toFixed(1)}%`}
                color={r.margenPct != null && r.margenPct < 0 ? 'text-red-600' : undefined}
                detalle="Precio de venta frente al último costo" />
            </div>
          )}

          <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
            <BarraFiltros
              fechas={{ desde: fechas.desde, hasta: fechas.hasta, onDesde: (v) => cambiarFecha('desde', v), onHasta: (v) => cambiarFecha('hasta', v) }}
              hayFiltros={hayFechas}
              onLimpiar={limpiarFechas}
              error={rangoMalo ? 'La fecha "Desde" no puede ser posterior a la fecha "Hasta".' : ''}
              cargando={cargando}
              resumen={r ? `${r.compras} compra${r.compras !== 1 ? 's' : ''} en el período · variación total del período: ${textoVariacion(r.variacionTotalPct)}` : ''}
            />

            {!r ? (
              <p className="text-gray-400 text-sm p-5">{hayFechas ? 'No hay compras de este producto en el período seleccionado.' : 'Este producto aún no tiene compras registradas.'}</p>
            ) : (
              <>
                <div className="p-4 border-b">
                  <GraficaCostos puntos={puntos} />
                </div>
                <table className="w-full text-left text-sm">
                  <thead className="bg-gray-100 text-xs font-bold border-b text-gray-600 uppercase tracking-wider">
                    <tr>
                      <th className="p-3">Fecha</th>
                      <th className="p-3">Compra</th>
                      <th className="p-3">Proveedor</th>
                      <th className="p-3">Cantidad</th>
                      <th className="p-3">Costo unitario</th>
                      <th className="p-3">Variación</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {datos.historial.map((h) => (
                      <tr key={h.compraId}>
                        <td className="p-3 text-gray-500">{new Date(h.fecha).toLocaleDateString('es-GT')}</td>
                        <td className="p-3 sku text-gray-400">#{h.compraId}</td>
                        <td className="p-3 text-gray-700">{h.proveedor || '—'}</td>
                        <td className="p-3 text-gray-700">{h.cantidad}</td>
                        <td className="p-3 font-bold text-gray-900">Q{formatQ(h.costo)}</td>
                        <td className="p-3">
                          <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${claseVariacion(h.variacionPct)}`}>{textoVariacion(h.variacionPct)}</span>
                          {h.variacionAbs != null && h.variacionAbs !== 0 && (
                            <span className="text-xs text-gray-400 ml-2">{h.variacionAbs > 0 ? '+' : '−'}Q{formatQ(Math.abs(h.variacionAbs))}</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <p className="px-4 py-3 text-xs text-gray-400 border-t">
                  Los costos se muestran por unidad. {datos.producto.unidadSecundariaNombre ? `Si compras por ${datos.producto.unidadSecundariaNombre} (${datos.producto.unidadSecundariaCantidad} unidades), multiplica el costo unitario por ${datos.producto.unidadSecundariaCantidad}. ` : ''}
                  El promedio está ponderado por la cantidad comprada.
                </p>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}