import { useState, useRef, useCallback } from 'react';
import { obtenerCostosProducto } from '../services/costosService';

// Estado de la consulta de costos de UN producto. Lo usan tanto el formulario de
// Registrar Compra (referencia al comprar) como el panel Variación de Costos.
export function useCostosProducto({ token }) {
  const [datos, setDatos] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');
  const contador = useRef(0);

  const consultar = useCallback(async (productoId, opciones = {}) => {
    const numero = ++contador.current;
    if (!productoId) { setDatos(null); setError(''); setCargando(false); return; }
    setCargando(true);
    setError('');
    const resultado = await obtenerCostosProducto(productoId, token, opciones);
    if (numero !== contador.current) return; // llegó una respuesta más nueva: esta se descarta
    setCargando(false);
    if (resultado.ok) {
      setDatos(resultado.data);
    } else {
      setDatos(null);
      setError(resultado.error);
    }
  }, [token]);

  const limpiar = useCallback(() => {
    contador.current++;
    setDatos(null); setError(''); setCargando(false);
  }, []);

  return { datos, cargando, error, consultar, limpiar };
}