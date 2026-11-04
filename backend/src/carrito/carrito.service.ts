import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { PrismaService } from '../comun/prisma/prisma.service';
import { camposProductoPublico } from '../productos/campos-producto';

type ProductoCarrito = { id: number; vendedorId: number; estado: string; stock: number };

// Por qué un ítem del carrito no se puede comprar ahora (null si está todo bien).
// El carrito se guarda en la base: entre que se agrega y se compra, el vendedor puede pausar,
// vender a otra persona o bajar el stock. Por eso se revisa cada vez que se muestra.
export function problemaDelItem(producto: { estado: string; stock: number }, cantidad: number): string | null {
  if (producto.estado === 'pausado') return 'El vendedor pausó esta publicación.';
  if (producto.estado === 'agotado' || producto.stock === 0) return 'Este producto se agotó.';
  if (producto.estado !== 'activo') return 'Esta publicación ya no está disponible.';
  if (cantidad > producto.stock) {
    return `Solo quedan ${producto.stock} ${producto.stock === 1 ? 'unidad' : 'unidades'}.`;
  }
  return null;
}

// HU-10: carrito con tope de stock. Nadie agrega su propio producto (422).
@Injectable()
export class CarritoService {
  constructor(private readonly prisma: PrismaService) {}

  async obtener(usuarioId: number) {
    const items = await this.prisma.itemCarrito.findMany({
      where: { usuarioId, producto: { estado: { not: 'eliminado' } } },
      orderBy: { productoId: 'asc' },
      select: { cantidad: true, producto: { select: camposProductoPublico } },
    });

    const conDetalle = items.map(({ cantidad, producto }) => ({
      producto,
      cantidad,
      subtotal: cantidad * producto.precio,
      problema: problemaDelItem(producto, cantidad),
    }));
    const comprables = conDetalle.filter((item) => !item.problema);

    return {
      items: conDetalle,
      unidades: conDetalle.reduce((suma, item) => suma + item.cantidad, 0),
      // Solo suma lo que se puede comprar ahora: es lo que se cobraría al confirmar.
      total: comprables.reduce((suma, item) => suma + item.subtotal, 0),
      // Cada vendedor distinto genera un pedido aparte.
      pedidosAGenerar: new Set(comprables.map((item) => item.producto.vendedor.id)).size,
      sePuedeComprar: conDetalle.length > 0 && comprables.length === conDetalle.length,
    };
  }

  // Suma unidades a lo que ya había en el carrito.
  async agregar(usuarioId: number, productoId: number, cantidad = 1) {
    const producto = await this.buscarComprable(usuarioId, productoId);
    const actual = await this.prisma.itemCarrito.findUnique({
      where: { usuarioId_productoId: { usuarioId, productoId } },
      select: { cantidad: true },
    });
    const enCarrito = actual?.cantidad ?? 0;
    this.validarStock(producto, enCarrito + cantidad, enCarrito);

    await this.prisma.itemCarrito.upsert({
      where: { usuarioId_productoId: { usuarioId, productoId } },
      create: { usuarioId, productoId, cantidad },
      update: { cantidad: { increment: cantidad } },
    });
    return this.obtener(usuarioId);
  }

  // Fija la cantidad final de un producto que ya está en el carrito.
  async cambiarCantidad(usuarioId: number, productoId: number, cantidad: number) {
    const existe = await this.prisma.itemCarrito.count({ where: { usuarioId, productoId } });
    if (!existe) throw new NotFoundException('Ese producto no está en tu carrito.');

    const producto = await this.buscarComprable(usuarioId, productoId);
    this.validarStock(producto, cantidad);

    await this.prisma.itemCarrito.update({
      where: { usuarioId_productoId: { usuarioId, productoId } },
      data: { cantidad },
    });
    return this.obtener(usuarioId);
  }

  async quitar(usuarioId: number, productoId: number) {
    await this.prisma.itemCarrito.deleteMany({ where: { usuarioId, productoId } });
    return this.obtener(usuarioId);
  }

  async vaciar(usuarioId: number) {
    await this.prisma.itemCarrito.deleteMany({ where: { usuarioId } });
    return this.obtener(usuarioId);
  }

  private async buscarComprable(usuarioId: number, productoId: number): Promise<ProductoCarrito> {
    const producto = await this.prisma.producto.findUnique({
      where: { id: productoId },
      select: { id: true, vendedorId: true, estado: true, stock: true },
    });
    if (!producto || producto.estado === 'eliminado') {
      throw new NotFoundException('La publicación no existe.');
    }
    if (producto.vendedorId === usuarioId) {
      throw new UnprocessableEntityException('No puedes comprar tu propio producto.');
    }
    if (producto.estado !== 'activo') {
      throw new ConflictException(
        producto.estado === 'pausado' ? 'El vendedor pausó esta publicación.' : 'Este producto se agotó.',
      );
    }
    return producto;
  }

  private validarStock(producto: ProductoCarrito, cantidadFinal: number, yaEnCarrito = 0) {
    if (cantidadFinal <= producto.stock) return;
    const quedan = `Solo quedan ${producto.stock} ${producto.stock === 1 ? 'unidad' : 'unidades'}`;
    throw new ConflictException(
      yaEnCarrito > 0 ? `${quedan} y ya tienes ${yaEnCarrito} en tu carrito.` : `${quedan}.`,
    );
  }
}
