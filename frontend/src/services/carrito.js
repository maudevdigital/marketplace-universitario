import { pedir } from './api';

// HU-10. Todas las acciones devuelven el carrito completo:
// { items: [{ producto, cantidad, subtotal, problema }], unidades, total, pedidosAGenerar, sePuedeComprar }
export const obtenerCarrito = () => pedir('/carrito');

export const agregarAlCarrito = (productoId, cantidad = 1) =>
  pedir('/carrito/items', { metodo: 'POST', cuerpo: { productoId, cantidad } });

export const cambiarCantidad = (productoId, cantidad) =>
  pedir(`/carrito/items/${productoId}`, { metodo: 'PATCH', cuerpo: { cantidad } });

export const quitarDelCarrito = (productoId) => pedir(`/carrito/items/${productoId}`, { metodo: 'DELETE' });

export const vaciarCarrito = () => pedir('/carrito', { metodo: 'DELETE' });
