// Una función por operación de la API. Son los mismos endpoints que usa el frontend web
// (frontend/src/services/): la aplicación móvil no tiene backend propio.
import { pedir } from './api';

// Sesión y usuarios
export const registrar = (datos) => pedir('/auth/registro', { metodo: 'POST', cuerpo: datos });
export const ingresar = (correo, contrasena) =>
  pedir('/auth/ingreso', { metodo: 'POST', cuerpo: { correo, contrasena } });
export const obtenerUsuarioActual = () => pedir('/auth/yo');
export const obtenerPerfil = (id) => pedir(`/usuarios/${id}`);

// Catálogo
export const listarCategorias = () => pedir('/categorias');

/** @param {{ q?, categoria?, precioMin?, precioMax?, orden?, pagina? }} filtros */
export function listarProductos(filtros = {}) {
  const parametros = new URLSearchParams();
  for (const [clave, valor] of Object.entries(filtros)) {
    if (valor !== undefined && valor !== null && valor !== '') parametros.append(clave, String(valor));
  }
  const consulta = parametros.toString();
  return pedir(`/productos${consulta ? `?${consulta}` : ''}`);
}

export const obtenerProducto = (id) => pedir(`/productos/${id}`);

// Mis publicaciones: FormData con los campos del producto y, si hay, la foto.
export const listarMisProductos = () => pedir('/productos/mios');
export const crearProducto = (formData) => pedir('/productos', { metodo: 'POST', cuerpo: formData });
export const actualizarProducto = (id, formData) => pedir(`/productos/${id}`, { metodo: 'PATCH', cuerpo: formData });
export const eliminarProducto = (id) => pedir(`/productos/${id}`, { metodo: 'DELETE' });

// Sugerencia de Mercado Libre a partir del título (el backend consulta a Mercado Libre).
export const sugerirProducto = (titulo) =>
  pedir(`/sugerencias/producto?titulo=${encodeURIComponent(titulo.trim())}`);

// Favoritos
export const listarFavoritos = () => pedir('/favoritos');
export const marcarFavorito = (productoId) => pedir(`/favoritos/${productoId}`, { metodo: 'POST' });
export const quitarFavorito = (productoId) => pedir(`/favoritos/${productoId}`, { metodo: 'DELETE' });

// Carrito
export const obtenerCarrito = () => pedir('/carrito');
export const agregarAlCarrito = (productoId, cantidad = 1) =>
  pedir('/carrito/items', { metodo: 'POST', cuerpo: { productoId, cantidad } });
export const cambiarCantidad = (productoId, cantidad) =>
  pedir(`/carrito/items/${productoId}`, { metodo: 'PATCH', cuerpo: { cantidad } });
export const quitarDelCarrito = (productoId) => pedir(`/carrito/items/${productoId}`, { metodo: 'DELETE' });
export const vaciarCarrito = () => pedir('/carrito', { metodo: 'DELETE' });

// Pedidos y pago simulado
export const comprarCarrito = () => pedir('/pedidos', { metodo: 'POST' });
/** @param {'comprador'|'vendedor'} rol */
export const listarPedidos = (rol) => pedir(`/pedidos?rol=${rol}`);
export const obtenerPedido = (id) => pedir(`/pedidos/${id}`);
/** @param {{ numeroTarjeta, titular, vencimiento, cvv }} datos */
export const pagarPedido = (id, datos) => pedir(`/pedidos/${id}/pago`, { metodo: 'POST', cuerpo: datos });
export const marcarEntregado = (id) => pedir(`/pedidos/${id}/entrega`, { metodo: 'POST' });
export const cancelarPedido = (id) => pedir(`/pedidos/${id}/cancelacion`, { metodo: 'POST' });

// Mensajes entre comprador y vendedor (MongoDB)
export const listarConversaciones = () => pedir('/conversaciones');
export const contarNoLeidos = () => pedir('/conversaciones/no-leidos');
export const obtenerConversacion = (id) => pedir(`/conversaciones/${id}`);
export const preguntarPorProducto = (productoId, texto) =>
  pedir('/conversaciones', { metodo: 'POST', cuerpo: { productoId, texto } });
export const responderConversacion = (id, texto) =>
  pedir(`/conversaciones/${id}/mensajes`, { metodo: 'POST', cuerpo: { texto } });
