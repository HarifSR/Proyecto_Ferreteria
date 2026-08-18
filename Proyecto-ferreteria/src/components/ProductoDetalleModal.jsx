import { formatQ } from '../utils/format';

export default function ProductoDetalleModal({ productoDetalle, setProductoDetalle }) {
  if (!productoDetalle) return null;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-6 z-50" onClick={() => setProductoDetalle(null)}>
      <div className="bg-white rounded-xl shadow-lg max-w-lg w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="p-6 space-y-4">
          <div className="flex justify-between items-start">
            <div>
              <p className="sku text-xs text-gray-400">{productoDetalle.id}</p>
              <h3 className="text-xl font-bold text-gray-900">{productoDetalle.nombre}</h3>
            </div>
            <button onClick={() => setProductoDetalle(null)} className="text-gray-400 hover:text-gray-700 text-xl font-bold leading-none px-2">×</button>
          </div>

          <div className="w-full h-48 rounded-lg border bg-gray-50 overflow-hidden flex items-center justify-center">
            {productoDetalle.url_imagen ? (
              <img src={productoDetalle.url_imagen} alt={productoDetalle.nombre} className="w-full h-full object-cover" onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }} />
            ) : null}
            <span className="text-gray-300 text-4xl" style={{ display: productoDetalle.url_imagen ? 'none' : 'flex' }}>—</span>
          </div>

          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Marca</p>
              <p className="font-semibold text-gray-800">{productoDetalle.marca || '—'}</p>
            </div>
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Categoría</p>
              <p className="font-semibold text-gray-800">{productoDetalle.categoria_nombre || '—'}</p>
            </div>
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Precio</p>
              <p className="font-bold text-gray-900">Q{formatQ(parseFloat(productoDetalle.precio))} <span className="text-gray-400 font-normal text-xs">/ {productoDetalle.unidad_codigo || 'und'}</span></p>
            </div>
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Stock disponible</p>
              <p className={`font-bold ${productoDetalle.cantidad_stock < 20 ? 'text-red-500' : 'text-green-600'}`}>{parseFloat(productoDetalle.cantidad_stock)} {productoDetalle.unidad_codigo || 'und'}</p>
            </div>
          </div>

          {productoDetalle.unidad_secundaria_nombre && productoDetalle.precio_secundario && (
            <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg text-sm">
              <p className="text-xs font-bold text-blue-700 uppercase tracking-wider mb-1">Segunda Forma de Venta</p>
              <p className="font-semibold text-gray-800">{productoDetalle.unidad_secundaria_nombre} ({productoDetalle.unidad_secundaria_cantidad} uds) — <span className="font-bold">Q{formatQ(parseFloat(productoDetalle.precio_secundario))}</span></p>
            </div>
          )}

          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Descripción</p>
            <p className="text-gray-700 text-sm">{productoDetalle.descripcion || 'Sin descripción registrada.'}</p>
          </div>

          <button onClick={() => setProductoDetalle(null)} className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-2 rounded-lg text-sm transition">Cerrar</button>
        </div>
      </div>
    </div>
  );
}