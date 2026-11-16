import { pedir } from './api';

// HU-05: el backend ya tiene estas rutas. Las pantallas que las usan son de HU-07 (Matías).
// crear y actualizar reciben un FormData porque pueden llevar la imagen:
//   const datos = new FormData(formulario)  // con <input name="imagen" type="file">

export const listarMisProductos = () => pedir('/productos/mios');

export const crearProducto = (formData) => pedir('/productos', { metodo: 'POST', cuerpo: formData });

export const actualizarProducto = (id, formData) =>
  pedir(`/productos/${id}`, { metodo: 'PATCH', cuerpo: formData });

export const eliminarProducto = (id) => pedir(`/productos/${id}`, { metodo: 'DELETE' });

// HU-06: catálogo público y detalle.
// filtros: { q, categoria, precioMin, precioMax, orden, pagina }; los vacíos no se envían.
export function listarProductos(filtros = {}) {
  const parametros = new URLSearchParams();
  for (const [clave, valor] of Object.entries(filtros)) {
    if (valor !== undefined && valor !== null && String(valor).trim() !== '') {
      parametros.set(clave, String(valor).trim());
    }
  }
  const consulta = parametros.toString();
  return pedir(`/productos${consulta ? `?${consulta}` : ''}`);
}

export const obtenerProducto = (id) => pedir(`/productos/${id}`);
