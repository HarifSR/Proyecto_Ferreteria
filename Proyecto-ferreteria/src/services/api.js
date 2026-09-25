import { API_URL } from '../config';

// Envoltorio central de fetch: arma la URL, agrega el token cuando existe,
// y da un formato de respuesta consistente { ok, data, error } a toda la app.
// Esta es la única parte del Frontend que sabe cómo hablar con la API REST;
// el resto del sistema (hooks, páginas) solo llama a estas funciones.
async function peticion(ruta, { method = 'GET', body, token } = {}) {
  try {
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`${API_URL}${ruta}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return { ok: false, error: data.error || 'Ocurrió un error al conectar con el servidor.' };
    }
    return { ok: true, data };
  } catch (error) {
    console.error(`Error de red en ${ruta}:`, error);
    return { ok: false, error: 'No se pudo conectar con el servidor.' };
  }
}

export const apiGet = (ruta, token) => peticion(ruta, { method: 'GET', token });
export const apiPost = (ruta, body, token) => peticion(ruta, { method: 'POST', body, token });
export const apiPut = (ruta, body, token) => peticion(ruta, { method: 'PUT', body, token });
export const apiPatch = (ruta, body, token) => peticion(ruta, { method: 'PATCH', body, token });
export const apiDelete = (ruta, token) => peticion(ruta, { method: 'DELETE', token });