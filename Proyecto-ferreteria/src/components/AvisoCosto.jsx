import { formatQ } from '../utils/format';
import {
  variacionPorcentual, costoEnPresentacion, superaUmbral, textoVariacion, claseVariacion, UMBRAL_VARIACION_PCT
} from '../utils/costos';

// Referencia que se muestra al registrar una compra: último costo, rango histórico y,
// mientras se escribe el costo nuevo, cuánto varía frente a la última compra.
//   producto: el producto elegido;  modo: 'unidad' | 'secundario';  costoIngresado: lo que se escribe
export default function AvisoCosto({ datos, cargando, producto, modo, costoIngresado }) {
  if (!producto) return null;
  if (cargando && !datos) return <p className="text-[11px] text-gray-400">Consultando costos anteriores...</p>;
  if (!datos || datos.producto.id !== producto.id) return null;

  if (!datos.resumen) {
    return (
      <div className="bg-gray-50 border rounded-lg p-2.5 text-xs text-gray-500">
        Primera compra registrada de este producto: aún no hay costos anteriores para comparar.
      </div>
    );
  }

  const r = datos.resumen;
  const enSecundaria = modo === 'secundario' && producto.unidad_secundaria_cantidad;
  const medida = enSecundaria ? `por ${producto.unidad_secundaria_nombre || 'lote'}` : 'por unidad';
  const ultimo = costoEnPresentacion(r.ultimo, producto, modo);
  const minimo = costoEnPresentacion(r.minimo, producto, modo);
  const maximo = costoEnPresentacion(r.maximo, producto, modo);
  const promedio = costoEnPresentacion(r.promedio, producto, modo);

  // El costo ingresado se compara contra la última compra, en la misma medida (unidad o lote)
  const escrito = parseFloat(costoIngresado);
  const pct = escrito > 0 ? variacionPorcentual(escrito, ultimo) : null;
  const diferencia = pct != null ? escrito - ultimo : null;

  return (
    <div className="bg-gray-50 border rounded-lg p-3 text-xs space-y-1.5">
      <div className="flex justify-between flex-wrap gap-x-4 gap-y-1">
        <span className="text-gray-500">
          Última compra: <span className="font-bold text-gray-900">Q{formatQ(ultimo)}</span> {medida}
          <span className="text-gray-400"> · {new Date(r.ultimaFecha).toLocaleDateString('es-GT')}{r.ultimoProveedor ? ` · ${r.ultimoProveedor}` : ''}</span>
        </span>
      </div>
      {r.compras > 1 && (
        <p className="text-gray-400">
          Rango histórico: Q{formatQ(minimo)} – Q{formatQ(maximo)} · Promedio: Q{formatQ(promedio)} ({r.compras} compras)
        </p>
      )}
      {pct != null && (
        <p className="flex items-center gap-2 flex-wrap">
          <span className={`font-bold px-2 py-0.5 rounded-full ${claseVariacion(pct)}`}>{textoVariacion(pct)}</span>
          <span className="text-gray-500">
            {diferencia === 0 ? 'igual que' : `${diferencia > 0 ? '+' : '−'}Q${formatQ(Math.abs(diferencia))} frente a`} la última compra
          </span>
          {superaUmbral(pct) && (
            <span className="font-semibold text-red-600">Cambio de {UMBRAL_VARIACION_PCT}% o más: revisa que el monto sea correcto.</span>
          )}
        </p>
      )}
    </div>
  );
}