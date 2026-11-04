import { pedir } from './api';

// HU-05: el backend ya tiene estas rutas. Las pantallas que las usan son de HU-07 (Matías).
// crear y actualizar reciben un FormData porque pueden llevar la imagen:
//   const datos = new FormData(formulario)  // con <input name="imagen" type="file">

export const listarMisProductos = () => pedir('/productos/mios');

export const crearProducto = (formData) => pedir('/productos', { metodo: 'POST', cuerpo: formData });

export const actualizarProducto = (id, formData) =>
  pedir(`/productos/${id}`, { metodo: 'PATCH', cuerpo: formData });

export const eliminarProducto = (id) => pedir(`/productos/${id}`, { metodo: 'DELETE' });

// HU-06 (Matías) agrega aquí listarProductos(filtros) y obtenerProducto(id).
