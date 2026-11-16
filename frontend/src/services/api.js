// Única puerta de salida hacia el backend. Todos los servicios usan pedir():
// agrega el token de sesión, arma el cuerpo y traduce los errores a ErrorApi.

export const URL_API = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

const CLAVE_TOKEN = 'unimarket.token';

export const leerToken = () => localStorage.getItem(CLAVE_TOKEN);
export const guardarToken = (token) => localStorage.setItem(CLAVE_TOKEN, token);
export const borrarToken = () => localStorage.removeItem(CLAVE_TOKEN);

// Error con el formato del backend: { estado, mensaje }.
// estado 0 significa que ni siquiera hubo respuesta (servidor apagado o sin red).
export class ErrorApi extends Error {
  constructor(estado, mensaje) {
    super(mensaje);
    this.estado = estado;
  }
}

/**
 * @param {string} ruta Por ejemplo '/productos/mios'
 * @param {object} [opciones]
 * @param {string} [opciones.metodo] GET, POST, PATCH o DELETE
 * @param {object|FormData} [opciones.cuerpo] Objeto (se envía como JSON) o FormData (con archivos)
 */
export async function pedir(ruta, { metodo = 'GET', cuerpo } = {}) {
  const cabeceras = {};
  const token = leerToken();
  if (token) cabeceras.Authorization = `Bearer ${token}`;

  let body;
  if (cuerpo instanceof FormData) {
    body = cuerpo; // el navegador pone el Content-Type con su separador
  } else if (cuerpo !== undefined) {
    cabeceras['Content-Type'] = 'application/json';
    body = JSON.stringify(cuerpo);
  }

  let respuesta;
  try {
    respuesta = await fetch(`${URL_API}${ruta}`, { method: metodo, headers: cabeceras, body });
  } catch {
    throw new ErrorApi(0, 'No se pudo conectar con el servidor. Revisa tu conexión e intenta de nuevo.');
  }

  const datos = respuesta.status === 204 ? null : await respuesta.json().catch(() => null);

  if (!respuesta.ok) {
    if (respuesta.status === 401 && token) {
      // El token venció o es inválido: se cierra la sesión en toda la aplicación.
      borrarToken();
      window.dispatchEvent(new Event('sesion-expirada'));
    }
    throw new ErrorApi(respuesta.status, datos?.mensaje ?? 'Ocurrió un error inesperado.');
  }
  return datos;
}

// Las imágenes vienen como ruta ("/imagenes/x.webp"); el navegador necesita la dirección completa.
export const urlImagen = (ruta) => (ruta ? `${URL_API}${ruta}` : '/sin-imagen.webp');
