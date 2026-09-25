import { useKardex } from '../hooks/useKardex';
import { formatQ } from '../utils/format';

export default function KardexPage({ productos, token }) {
  const { productoSeleccionado, datosKardex, cargando, error, consultarKardex } = useKardex(token);

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Movimientos por Producto <span className="text-sm font-normal text-gray-400">(Kardex)</span></h2>
        <p className="text-sm text-gray-400 mt-0.5">Historial de entradas y salidas de un producto, con su saldo acumulado.</p>
      </div>

      <div className="bg-white p-4 rounded-xl border shadow-sm max-w-md">
        <label className="text-xs font-bold text-gray-500">Selecciona un producto</label>
        <select
          value={productoSeleccionado}
          onChange={(e) => consultarKardex(e.target.value)}
          className="w-full p-2 border rounded bg-gray-50 text-sm mt-1"
        >
          <option value="">Seleccionar producto</option>
          {productos.map(p => <option key={p.id} value={p.id}>{p.id} — {p.nombre}</option>)}
        </select>
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
              <p className="font-bold text-gray-900">{datosKardex.producto.stockActual} uds</p>
            </div>
          </div>

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
              <tr className="bg-gray-50">
                <td className="p-3 text-gray-400" colSpan={5}>Saldo inicial (antes del primer movimiento registrado)</td>
                <td className="p-3 font-bold">{datosKardex.saldoInicial}</td>
              </tr>
              {datosKardex.movimientos.length === 0 ? (
                <tr><td colSpan={6} className="p-6 text-center text-gray-400">Este producto aún no tiene ventas ni compras registradas.</td></tr>
              ) : datosKardex.movimientos.map((m, i) => (
                <tr key={i}>
                  <td className="p-3 text-gray-500">{new Date(m.fecha).toLocaleDateString('es-GT')}</td>
                  <td className="p-3">
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${m.tipo === 'Entrada' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{m.tipo}</span>
                  </td>
                  <td className="p-3 text-gray-500">{m.referencia}</td>
                  <td className={`p-3 font-semibold ${m.cantidad >= 0 ? 'text-green-700' : 'text-red-700'}`}>{m.cantidad >= 0 ? '+' : ''}{m.cantidad}</td>
                  <td className="p-3 text-gray-500">Q{formatQ(m.costoOPrecio)}</td>
                  <td className="p-3 font-bold text-gray-900">{m.saldo}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}