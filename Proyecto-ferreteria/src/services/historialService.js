import { apiGet } from './api';
import { aQueryString } from '../utils/filtros';

// Cuántos resultados se piden por búsqueda (el Backend admite hasta 200).
const LIMITE = 50;

// Busca en TODO el historial de ventas con los filtros indicados.
export const buscarVentas = (filtros, token) =>
  apiGet(`/api/ventas/buscar?${aQueryString(filtros, { limite: LIMITE })}`, token);

// Busca en TODO el historial de compras (solo administrador).
export const buscarCompras = (filtros, token) =>
  apiGet(`/api/compras/buscar?${aQueryString(filtros, { limite: LIMITE })}`, token);