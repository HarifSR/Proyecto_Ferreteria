import { apiGet } from './api';
import { aQueryString } from '../utils/filtros';

// Historial de costos de compra de un producto, con la variación entre compras.
// opciones: { desde, hasta, excluirCompra, limite }
export const obtenerCostosProducto = (productoId, token, opciones = {}) =>
  apiGet(`/api/compras/costos/${encodeURIComponent(productoId)}?${aQueryString(opciones)}`, token);