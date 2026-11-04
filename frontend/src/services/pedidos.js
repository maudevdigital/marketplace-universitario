import { pedir } from './api';

// HU-11: comprar todo el carrito (devuelve un pedido por vendedor) y seguir los pedidos.
export const comprarCarrito = () => pedir('/pedidos', { metodo: 'POST' });

// rol: 'comprador' (mis compras) o 'vendedor' (mis ventas)
export const listarPedidos = (rol = 'comprador') => pedir(`/pedidos?rol=${rol}`);

export const obtenerPedido = (id) => pedir(`/pedidos/${id}`);
