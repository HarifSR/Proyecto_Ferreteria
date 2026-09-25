import { apiGet } from './api';

// Modelo de negocio del Kardex: obtiene el historial de movimientos
// (entradas por compra, salidas por venta) y el saldo acumulado de un producto.
export const obtenerKardex = (productoId, token) =>
  apiGet(`/api/reportes/kardex/${productoId}`, token);