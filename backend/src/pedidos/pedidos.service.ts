import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../comun/prisma/prisma.service';
import { RolPedido } from './dto/pedidos.dto';

// Forma en que un pedido sale de la API (lista y detalle).
export const camposPedido = {
  id: true,
  estado: true,
  total: true,
  creadoEn: true,
  actualizadoEn: true,
  comprador: { select: { id: true, nombre: true, carrera: true } },
  vendedor: { select: { id: true, nombre: true, carrera: true } },
  detalles: {
    orderBy: { id: 'asc' },
    select: {
      id: true,
      cantidad: true,
      precioUnitario: true,
      subtotal: true,
      producto: { select: { id: true, titulo: true, imagen: true } },
    },
  },
} satisfies Prisma.PedidoSelect;

const camposDetallePedido = {
  ...camposPedido,
  pagos: {
    orderBy: { creadoEn: 'desc' },
    select: { id: true, monto: true, estado: true, comprobante: true, creadoEn: true },
  },
} satisfies Prisma.PedidoSelect;

// HU-11: comprar el carrito y seguir los pedidos.
@Injectable()
export class PedidosService {
  constructor(private readonly prisma: PrismaService) {}

  // Todo o nada: si un producto no tiene stock, no se crea ningún pedido ni se toca el stock.
  // El carrito se agrupa por vendedor: cada vendedor recibe su propio pedido.
  async comprarCarrito(compradorId: number) {
    return this.prisma.$transaction(async (tx) => {
      const items = await tx.itemCarrito.findMany({
        where: { usuarioId: compradorId },
        orderBy: { productoId: 'asc' }, // orden fijo: dos compras simultáneas bloquean filas en el mismo orden
        include: { producto: true },
      });
      if (items.length === 0) {
        throw new UnprocessableEntityException('Tu carrito está vacío.');
      }

      const porVendedor = new Map<number, Prisma.DetallePedidoCreateWithoutPedidoInput[]>();

      for (const { producto, cantidad } of items) {
        if (producto.vendedorId === compradorId) {
          throw new UnprocessableEntityException(`No puedes comprar tu propio producto («${producto.titulo}»).`);
        }
        if (producto.estado !== 'activo') {
          throw new ConflictException(`«${producto.titulo}» ya no está disponible. Sácalo del carrito para continuar.`);
        }

        // Se descuenta solo si todavía alcanza: la condición y el descuento van en la misma
        // sentencia, así dos personas no pueden comprar la última unidad a la vez.
        const descontado = await tx.producto.updateMany({
          where: { id: producto.id, estado: 'activo', stock: { gte: cantidad } },
          data: { stock: { decrement: cantidad } },
        });
        if (descontado.count === 0) {
          throw new ConflictException(`No hay stock suficiente de «${producto.titulo}». Revisa tu carrito.`);
        }
        await tx.producto.updateMany({ where: { id: producto.id, stock: 0 }, data: { estado: 'agotado' } });

        const detalles = porVendedor.get(producto.vendedorId) ?? [];
        detalles.push({
          producto: { connect: { id: producto.id } },
          cantidad,
          // Se copia el precio de hoy: si el vendedor lo cambia después, el pedido no cambia.
          precioUnitario: producto.precio,
          subtotal: cantidad * producto.precio,
        });
        porVendedor.set(producto.vendedorId, detalles);
      }

      const pedidos = [];
      for (const [vendedorId, detalles] of porVendedor) {
        pedidos.push(
          await tx.pedido.create({
            data: {
              comprador: { connect: { id: compradorId } },
              vendedor: { connect: { id: vendedorId } },
              total: detalles.reduce((suma, detalle) => suma + detalle.subtotal, 0),
              detalles: { create: detalles },
            },
            select: camposPedido,
          }),
        );
      }

      await tx.itemCarrito.deleteMany({ where: { usuarioId: compradorId } });
      return pedidos;
    });
  }

  listar(usuarioId: number, rol: RolPedido = 'comprador') {
    return this.prisma.pedido.findMany({
      where: rol === 'vendedor' ? { vendedorId: usuarioId } : { compradorId: usuarioId },
      orderBy: [{ creadoEn: 'desc' }, { id: 'desc' }],
      select: camposPedido,
    });
  }

  // Solo lo ven quien compró y quien vende. miRol le dice a la pantalla qué acciones mostrar.
  async detalle(id: number, usuarioId: number) {
    const pedido = await this.prisma.pedido.findUnique({ where: { id }, select: camposDetallePedido });
    if (!pedido) throw new NotFoundException('El pedido no existe.');
    const miRol = this.rolEn(pedido, usuarioId);
    return { ...pedido, miRol };
  }

  // Lanza 403 si la persona no participa en el pedido.
  rolEn(pedido: { comprador: { id: number }; vendedor: { id: number } }, usuarioId: number): RolPedido {
    if (pedido.comprador.id === usuarioId) return 'comprador';
    if (pedido.vendedor.id === usuarioId) return 'vendedor';
    throw new ForbiddenException('Este pedido es de otras personas.');
  }
}
