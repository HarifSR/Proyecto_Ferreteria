import { useState, useEffect, useRef, useCallback } from 'react';
import { buscarVentas, buscarCompras } from '../services/historialService';
import { rangoInvalido, hayFiltros } from '../utils/filtros';

const VACIOS_VENTAS = { q: '', tipo: '', estado: '', desde: '', hasta: '' };
const VACIOS_COMPRAS = { q: '', desde: '', hasta: '' };
const SIN_DATOS = { total: 0, sumaTotal: null, resultados: [] };

// Lógica común de una búsqueda con filtros: espera a que termines de escribir (debounce),
// ignora respuestas viejas y vuelve a consultar cuando cambia algún filtro.
function useBusqueda({ buscar, token, habilitado, vacios, version }) {
  const [filtros, setFiltros] = useState(vacios);
  const [textoAplicado, setTextoAplicado] = useState('');
  const [datos, setDatos] = useState(SIN_DATOS);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');
  const contador = useRef(0);

  // El texto se aplica 350 ms después de la última tecla, para no consultar en cada letra
  useEffect(() => {
    const espera = setTimeout(() => setTextoAplicado(filtros.q), 350);
    return () => clearTimeout(espera);
  }, [filtros.q]);

  const rangoMalo = rangoInvalido(filtros.desde, filtros.hasta);
  const clave = JSON.stringify({ ...filtros, q: textoAplicado });

  useEffect(() => {
    if (!habilitado || !token) return;
    if (rangoMalo) {
      setError('La fecha "Desde" no puede ser posterior a la fecha "Hasta".');
      return;
    }
    const numero = ++contador.current;
    setCargando(true);
    setError('');
    buscar(JSON.parse(clave), token).then((resultado) => {
      if (numero !== contador.current) return; // llegó una respuesta más nueva: esta se descarta
      setCargando(false);
      if (resultado.ok) {
        setDatos(resultado.data);
      } else {
        setDatos(SIN_DATOS);
        setError(resultado.error);
      }
    });
  }, [habilitado, token, clave, rangoMalo, version, buscar]);

  const actualizar = (campo, valor) => setFiltros((f) => ({ ...f, [campo]: valor }));
  const limpiar = () => { setFiltros(vacios); setTextoAplicado(''); };

  return { filtros, actualizar, limpiar, hayFiltros: hayFiltros(filtros), datos, cargando, error };
}

// Estado y lógica de los filtros del panel Historial (ventas y compras).
// `activo` indica si el panel está visible: solo entonces se consulta al servidor.
export function useHistorial({ token, activo, esAdmin }) {
  const [version, setVersion] = useState(0);

  const ventas = useBusqueda({ buscar: buscarVentas, token, habilitado: activo, vacios: VACIOS_VENTAS, version });
  const compras = useBusqueda({ buscar: buscarCompras, token, habilitado: activo && esAdmin, vacios: VACIOS_COMPRAS, version });

  // Se llama después de crear, editar o eliminar una venta/compra para refrescar las listas
  const recargar = useCallback(() => setVersion((v) => v + 1), []);

  return { ventas, compras, recargar };
}