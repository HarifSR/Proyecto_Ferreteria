import { useState } from 'react';
import { obtenerKardex } from '../services/kardexService';

// Encapsula el estado y la lógica del Kardex, independiente de cómo se dibuje en pantalla.
export function useKardex(token) {
  const [productoSeleccionado, setProductoSeleccionado] = useState('');
  const [datosKardex, setDatosKardex] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');

  const consultarKardex = async (productoId) => {
    setProductoSeleccionado(productoId);
    setError('');
    if (!productoId) { setDatosKardex(null); return; }

    setCargando(true);
    const resultado = await obtenerKardex(productoId, token);
    setCargando(false);

    if (resultado.ok) {
      setDatosKardex(resultado.data);
    } else {
      setDatosKardex(null);
      setError(resultado.error);
    }
  };

  return { productoSeleccionado, datosKardex, cargando, error, consultarKardex };
}