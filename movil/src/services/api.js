// Única puerta de salida hacia el backend (la misma API del Hito 3). Igual que en el frontend web:
// agrega el token de sesión, arma el cuerpo y traduce los errores a ErrorApi.
import Constants from 'expo-constants';
import * as SecureStore from 'expo-secure-store';

// En el iPhone, «localhost» es el propio teléfono: hay que usar la IP del computador en la red.
// Expo ya la conoce (es desde donde el teléfono bajó la app), así que la API se busca en esa
// misma IP. El puerto es 3000 salvo que movil/.env.local diga otro; ahí también se puede fijar
// la dirección completa (ver .env.example).
const PUERTO_API = process.env.EXPO_PUBLIC_API_PUERTO || '3000';

function direccionDelComputador() {
  const host = Constants.expoConfig?.hostUri?.split(':')[0] || 'localhost';
  return `http://${host}:${PUERTO_API}`;
}

export const URL_API = process.env.EXPO_PUBLIC_API_URL || direccionDelComputador();

// Si el servidor no contesta en este tiempo, se avisa en vez de dejar la pantalla cargando.
// Con foto se da más tiempo, porque la subida es más lenta.
const ESPERA_MAXIMA_MS = 10000;
const ESPERA_MAXIMA_CON_FOTO_MS = 30000;

const CLAVE_TOKEN = 'unimarket.token';

// El token se guarda cifrado en el teléfono (el equivalente seguro de localStorage).
export const leerToken = () => SecureStore.getItemAsync(CLAVE_TOKEN);
export const guardarToken = (token) => SecureStore.setItemAsync(CLAVE_TOKEN, token);
export const borrarToken = () => SecureStore.deleteItemAsync(CLAVE_TOKEN);

// Error con el formato del backend: { estado, mensaje }.
// estado 0 significa que no hubo respuesta (servidor apagado, sin red o IP equivocada).
export class ErrorApi extends Error {
  constructor(estado, mensaje) {
    super(mensaje);
    this.estado = estado;
  }
}

// La sesión avisa aquí cuando el backend responde 401 (token vencido).
let alExpirarSesion = () => {};
export const cuandoExpireLaSesion = (funcion) => {
  alExpirarSesion = funcion;
};

/**
 * @param {string} ruta Por ejemplo '/productos?q=casio'
 * @param {object} [opciones]
 * @param {string} [opciones.metodo] GET, POST, PATCH o DELETE
 * @param {object|FormData} [opciones.cuerpo] Objeto (se envía como JSON) o FormData (con la foto)
 */
export async function pedir(ruta, { metodo = 'GET', cuerpo } = {}) {
  const cabeceras = { Accept: 'application/json' };
  const token = await leerToken();
  if (token) cabeceras.Authorization = `Bearer ${token}`;

  let body;
  if (cuerpo instanceof FormData) {
    body = cuerpo; // fetch pone el Content-Type con su separador
  } else if (cuerpo !== undefined) {
    cabeceras['Content-Type'] = 'application/json';
    body = JSON.stringify(cuerpo);
  }

  const controlador = new AbortController();
  const espera = cuerpo instanceof FormData ? ESPERA_MAXIMA_CON_FOTO_MS : ESPERA_MAXIMA_MS;
  const temporizador = setTimeout(() => controlador.abort(), espera);

  let respuesta;
  let datos;
  try {
    respuesta = await fetch(`${URL_API}${ruta}`, {
      method: metodo,
      headers: cabeceras,
      body,
      signal: controlador.signal,
    });
    datos = respuesta.status === 204 ? null : await respuesta.json().catch(() => null);
  } catch (error) {
    // En desarrollo, el motivo real queda en la terminal de Expo (la persona ve un mensaje simple).
    if (__DEV__) console.warn(`[api] ${metodo} ${URL_API}${ruta} falló antes de recibir respuesta:`, error?.message);
    const seAgotoElTiempo = controlador.signal.aborted;
    throw new ErrorApi(
      0,
      seAgotoElTiempo
        ? 'El servidor no respondió a tiempo. Revisa que el backend esté encendido y vuelve a intentar.'
        : 'No se pudo conectar con el servidor. Revisa que el teléfono y el computador estén en la misma red.',
    );
  } finally {
    clearTimeout(temporizador);
  }

  if (!respuesta.ok) {
    if (respuesta.status === 401 && token) {
      await borrarToken();
      alExpirarSesion();
    }
    throw new ErrorApi(respuesta.status, datos?.mensaje ?? 'Ocurrió un error inesperado.');
  }
  return datos;
}

// Las imágenes vienen como ruta ("/imagenes/x.webp"); el teléfono necesita la dirección completa.
export const urlImagen = (ruta) => (ruta ? `${URL_API}${ruta}` : null);
