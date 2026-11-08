// Herramientas compartidas por las pruebas de la API (HU-14).
// Se corren contra el proyecto levantado: docker compose up -d && npm run test:api
// Cada prueba crea sus propios usuarios y productos con un sufijo al azar, así se pueden
// repetir sin reiniciar la base y no dependen de los datos iniciales.
import { readFile } from 'node:fs/promises';
import { randomBytes } from 'node:crypto';

export const API = process.env.API_URL ?? 'http://localhost:3000';
export const sufijo = () => randomBytes(3).toString('hex');

/** Llama a la API y devuelve { estado, cuerpo } (nunca lanza por un 4xx o 5xx). */
export async function pedir(metodo, ruta, { token, cuerpo, formulario } = {}) {
  const cabeceras = {};
  if (token) cabeceras.Authorization = `Bearer ${token}`;
  let body;
  if (formulario) {
    body = new FormData();
    for (const [clave, valor] of Object.entries(formulario)) body.append(clave, valor);
  } else if (cuerpo !== undefined) {
    cabeceras['Content-Type'] = 'application/json';
    body = JSON.stringify(cuerpo);
  }
  const respuesta = await fetch(`${API}${ruta}`, { method: metodo, headers: cabeceras, body });
  const texto = await respuesta.text();
  return { estado: respuesta.status, cuerpo: texto ? JSON.parse(texto) : null };
}

/** Crea una cuenta nueva y devuelve { token, id, nombre }. */
export async function crearUsuario(nombre = 'Prueba') {
  const correo = `prueba.${sufijo()}@alumnos.cl`;
  const { estado, cuerpo } = await pedir('POST', '/auth/registro', {
    cuerpo: { nombre, correo, contrasena: 'Clave1234' },
  });
  if (estado !== 201) throw new Error(`No se pudo crear el usuario de prueba: ${JSON.stringify(cuerpo)}`);
  return { token: cuerpo.token, id: cuerpo.usuario.id, nombre, correo };
}

/** Publica un producto y devuelve el producto creado. */
export async function publicar(token, datos = {}) {
  const { estado, cuerpo } = await pedir('POST', '/productos', {
    token,
    formulario: {
      titulo: `Producto de prueba ${sufijo()}`,
      descripcion: 'Producto creado por las pruebas automáticas del Hito 3.',
      categoriaId: '2',
      precio: '10000',
      stock: '1',
      ...datos,
    },
  });
  if (estado !== 201) throw new Error(`No se pudo publicar: ${JSON.stringify(cuerpo)}`);
  return cuerpo;
}

/** Una imagen real del catálogo inicial, para probar la subida. */
export async function imagenDePrueba() {
  const bytes = await readFile(new URL('../../imagenes-iniciales/libro1.webp', import.meta.url));
  return new Blob([bytes], { type: 'image/webp' });
}

export const stockDe = async (id) => {
  const { cuerpo } = await pedir('GET', `/productos/${id}`);
  return { stock: cuerpo.stock, estado: cuerpo.estado };
};
