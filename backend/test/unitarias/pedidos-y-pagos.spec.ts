// HU-14: compra «todo o nada», pago simulado y cambios de estado, con la base simulada.
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  HttpException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { PagosService, TARJETA_APROBADA, TARJETA_RECHAZADA } from '../../src/pedidos/pagos.service';
import { PedidosService } from '../../src/pedidos/pedidos.service';

const producto = (id: number, vendedorId: number, stock = 5, precio = 1000) => ({
  id,
  vendedorId,
  stock,
  precio,
  estado: 'activo',
  titulo: `Producto ${id}`,
});

// Simula la transacción: entrega un «tx» con las mismas operaciones que usa el servicio.
function crearPedidos(items: { producto: ReturnType<typeof producto>; cantidad: number }[], stockAlcanza = true) {
  const tx = {
    itemCarrito: { findMany: jest.fn().mockResolvedValue(items), deleteMany: jest.fn() },
    producto: { updateMany: jest.fn().mockResolvedValue({ count: stockAlcanza ? 1 : 0 }) },
    pedido: { create: jest.fn().mockImplementation(({ data }) => Promise.resolve({ total: data.total })) },
  };
  const prisma = { $transaction: (trabajo: (t: typeof tx) => unknown) => trabajo(tx) };
  return { servicio: new PedidosService(prisma as never), tx };
}

describe('Comprar el carrito', () => {
  it('no se puede comprar un carrito vacío', async () => {
    const { servicio } = crearPedidos([]);
    await expect(servicio.comprarCarrito(10)).rejects.toBeInstanceOf(UnprocessableEntityException);
  });

  it('nadie compra su propio producto', async () => {
    const { servicio, tx } = crearPedidos([{ producto: producto(1, 10), cantidad: 1 }]);
    await expect(servicio.comprarCarrito(10)).rejects.toBeInstanceOf(UnprocessableEntityException);
    expect(tx.pedido.create).not.toHaveBeenCalled();
  });

  it('si el stock no alcanza, no se crea ningún pedido ni se vacía el carrito', async () => {
    const { servicio, tx } = crearPedidos([{ producto: producto(1, 2), cantidad: 3 }], false);
    await expect(servicio.comprarCarrito(10)).rejects.toBeInstanceOf(ConflictException);
    expect(tx.pedido.create).not.toHaveBeenCalled();
    expect(tx.itemCarrito.deleteMany).not.toHaveBeenCalled();
  });

  it('crea un pedido por vendedor con el precio copiado y vacía el carrito', async () => {
    const { servicio, tx } = crearPedidos([
      { producto: producto(1, 2, 5, 1000), cantidad: 2 },
      { producto: producto(2, 2, 5, 500), cantidad: 1 },
      { producto: producto(3, 7, 5, 3000), cantidad: 1 },
    ]);
    const pedidos = await servicio.comprarCarrito(10);
    expect(pedidos).toHaveLength(2);
    expect(pedidos.map((p) => p.total).sort()).toEqual([2500, 3000]);
    expect(tx.itemCarrito.deleteMany).toHaveBeenCalledWith({ where: { usuarioId: 10 } });
  });
});

describe('Pago simulado y estados', () => {
  const tarjeta = { numeroTarjeta: TARJETA_APROBADA, titular: 'Estudiante Demo', vencimiento: '12/40', cvv: '123' };

  function crearPagos(pedido: { estado: string; miRol: 'comprador' | 'vendedor' }, cambiaEstado = true) {
    const detalle = { id: 1, total: 2500, detalles: [{ cantidad: 2, producto: { id: 1 } }], ...pedido };
    const pedidos = { detalle: jest.fn().mockResolvedValue(detalle) };
    const tx = {
      pedido: { updateMany: jest.fn().mockResolvedValue({ count: cambiaEstado ? 1 : 0 }) },
      pago: { create: jest.fn() },
      producto: { update: jest.fn(), updateMany: jest.fn() },
    };
    const prisma = {
      pago: { create: jest.fn() },
      pedido: tx.pedido,
      $transaction: (trabajo: (t: typeof tx) => unknown) => trabajo(tx),
    };
    return { servicio: new PagosService(prisma as never, pedidos as never), prisma, tx };
  }

  it('la tarjeta rechazada responde 402, guarda el intento y deja el pedido pendiente', async () => {
    const { servicio, prisma, tx } = crearPagos({ estado: 'pendiente', miRol: 'comprador' });
    const intento = servicio.pagar(1, 10, { ...tarjeta, numeroTarjeta: TARJETA_RECHAZADA });
    await expect(intento).rejects.toBeInstanceOf(HttpException);
    await expect(intento).rejects.toMatchObject({ status: 402 });
    expect(prisma.pago.create.mock.calls[0][0].data.estado).toBe('rechazado');
    expect(tx.pedido.updateMany).not.toHaveBeenCalled();
  });

  it('la tarjeta aprobada marca el pedido como pagado y guarda el comprobante', async () => {
    const { servicio, tx } = crearPagos({ estado: 'pendiente', miRol: 'comprador' });
    await servicio.pagar(1, 10, tarjeta);
    expect(tx.pedido.updateMany).toHaveBeenCalledWith({ where: { id: 1, estado: 'pendiente' }, data: { estado: 'pagado' } });
    expect(tx.pago.create.mock.calls[0][0].data).toMatchObject({ estado: 'aprobado', monto: 2500 });
  });

  it('el vendedor no puede pagar', async () => {
    const { servicio } = crearPagos({ estado: 'pendiente', miRol: 'vendedor' });
    await expect(servicio.pagar(1, 2, tarjeta)).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('no se paga dos veces', async () => {
    const { servicio } = crearPagos({ estado: 'pagado', miRol: 'comprador' });
    await expect(servicio.pagar(1, 10, tarjeta)).rejects.toBeInstanceOf(ConflictException);
  });

  it('rechaza una tarjeta vencida', async () => {
    const { servicio } = crearPagos({ estado: 'pendiente', miRol: 'comprador' });
    await expect(servicio.pagar(1, 10, { ...tarjeta, vencimiento: '01/20' })).rejects.toBeInstanceOf(BadRequestException);
  });

  it('no se puede entregar un pedido sin pagar', async () => {
    const { servicio } = crearPagos({ estado: 'pendiente', miRol: 'vendedor' }, false);
    await expect(servicio.entregar(1, 2)).rejects.toBeInstanceOf(ConflictException);
  });

  it('cancelar devuelve el stock de cada producto', async () => {
    const { servicio, tx } = crearPagos({ estado: 'pagado', miRol: 'comprador' });
    await servicio.cancelar(1, 10);
    expect(tx.producto.update).toHaveBeenCalledWith({ where: { id: 1 }, data: { stock: { increment: 2 } } });
  });

  it('lo entregado no se puede cancelar', async () => {
    const { servicio, tx } = crearPagos({ estado: 'entregado', miRol: 'comprador' }, false);
    await expect(servicio.cancelar(1, 10)).rejects.toBeInstanceOf(ConflictException);
    expect(tx.producto.update).not.toHaveBeenCalled();
  });
});
