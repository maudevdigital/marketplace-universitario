import { pedir } from './api';

// HU-11: comprar todo el carrito (devuelve un pedido por vendedor) y seguir los pedidos.
export const comprarCarrito = () => pedir('/pedidos', { metodo: 'POST' });

// rol: 'comprador' (mis compras) o 'vendedor' (mis ventas)
export const listarPedidos = (rol = 'comprador') => pedir(`/pedidos?rol=${rol}`);

export const obtenerPedido = (id) => pedir(`/pedidos/${id}`);

// HU-12: todas devuelven el pedido actualizado.
// datos: { numeroTarjeta, titular, vencimiento, cvv }. Rechazo → ErrorApi con estado 402.
export const pagarPedido = (id, datos) => pedir(`/pedidos/${id}/pago`, { metodo: 'POST', cuerpo: datos });

export const marcarEntregado = (id) => pedir(`/pedidos/${id}/entrega`, { metodo: 'POST' });

export const cancelarPedido = (id) => pedir(`/pedidos/${id}/cancelacion`, { metodo: 'POST' });
