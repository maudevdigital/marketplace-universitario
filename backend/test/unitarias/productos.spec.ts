// HU-14: reglas de las publicaciones (dueño, stock y archivado), con la base simulada.
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { ProductosService } from '../../src/productos/productos.service';

const publicacion = { id: 5, vendedorId: 1, estado: 'activo', stock: 2, imagen: null };

function crearServicio(producto: object | null = publicacion, enPedidos = 0) {
  const prisma = {
    producto: {
      findUnique: jest.fn().mockResolvedValue(producto),
      update: jest.fn().mockImplementation(({ data }) => Promise.resolve({ ...producto, ...data })),
      delete: jest.fn().mockResolvedValue(producto),
    },
    detallePedido: { count: jest.fn().mockResolvedValue(enPedidos) },
    itemCarrito: { deleteMany: jest.fn() },
    favorito: { deleteMany: jest.fn() },
    $transaction: jest.fn().mockResolvedValue([]),
  };
  const categorias = { existe: jest.fn().mockResolvedValue(true) };
  return { servicio: new ProductosService(prisma as never, categorias as never), prisma };
}

describe('Publicaciones', () => {
  it('solo el dueño puede editar', async () => {
    const { servicio, prisma } = crearServicio();
    await expect(servicio.actualizar(5, 99, { precio: 1 })).rejects.toBeInstanceOf(ForbiddenException);
    expect(prisma.producto.update).not.toHaveBeenCalled();
  });

  it('una publicación archivada ya no existe para nadie', async () => {
    const { servicio } = crearServicio({ ...publicacion, estado: 'eliminado' });
    await expect(servicio.actualizar(5, 1, { precio: 1 })).rejects.toBeInstanceOf(NotFoundException);
  });

  it('con stock 0 queda agotada aunque se pida activarla', async () => {
    const { servicio, prisma } = crearServicio();
    await servicio.actualizar(5, 1, { stock: 0, estado: 'activo' });
    expect(prisma.producto.update.mock.calls[0][0].data.estado).toBe('agotado');
  });

  it('al reponer stock vuelve a estar activa', async () => {
    const { servicio, prisma } = crearServicio({ ...publicacion, estado: 'agotado', stock: 0 });
    await servicio.actualizar(5, 1, { stock: 4 });
    expect(prisma.producto.update.mock.calls[0][0].data.estado).toBe('activo');
  });

  it('respeta la pausa si se repone stock', async () => {
    const { servicio, prisma } = crearServicio({ ...publicacion, estado: 'pausado' });
    await servicio.actualizar(5, 1, { stock: 4 });
    expect(prisma.producto.update.mock.calls[0][0].data.estado).toBe('pausado');
  });

  it('si ya se vendió, eliminar la archiva en vez de borrarla', async () => {
    const { servicio, prisma } = crearServicio(publicacion, 2);
    await expect(servicio.eliminar(5, 1)).resolves.toMatchObject({ archivado: true });
    expect(prisma.producto.delete).not.toHaveBeenCalled();
  });

  it('si nunca se vendió, se borra de verdad', async () => {
    const { servicio, prisma } = crearServicio(publicacion, 0);
    await expect(servicio.eliminar(5, 1)).resolves.toMatchObject({ archivado: false });
    expect(prisma.producto.delete).toHaveBeenCalledWith({ where: { id: 5 } });
  });
});
