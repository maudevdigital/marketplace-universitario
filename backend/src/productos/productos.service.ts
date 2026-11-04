import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { EstadoProducto } from '@prisma/client';
import { CategoriasService } from '../categorias/categorias.service';
import { borrarImagenSubida, rutaPublica } from '../comun/imagenes';
import { PrismaService } from '../comun/prisma/prisma.service';
import { camposProductoPublico } from './campos-producto';
import { ActualizarProductoDto, CrearProductoDto } from './dto/producto.dto';

@Injectable()
export class ProductosService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly categorias: CategoriasService,
  ) {}

  async crear(vendedorId: number, datos: CrearProductoDto, archivo?: Express.Multer.File) {
    await this.validarCategoria(datos.categoriaId);
    const { imagen: _archivo, ...campos } = datos;
    return this.prisma.producto.create({
      data: {
        ...campos,
        vendedorId,
        imagen: archivo ? rutaPublica(archivo) : null,
      },
      select: camposProductoPublico,
    });
  }

  async actualizar(id: number, usuarioId: number, datos: ActualizarProductoDto, archivo?: Express.Multer.File) {
    const actual = await this.buscarPropio(id, usuarioId);
    if (datos.categoriaId) await this.validarCategoria(datos.categoriaId);

    const { imagen: _archivo, estado, ...campos } = datos;
    const stock = datos.stock ?? actual.stock;
    const actualizado = await this.prisma.producto.update({
      where: { id },
      data: {
        ...campos,
        estado: this.estadoSegunStock(stock, estado, actual.estado),
        ...(archivo && { imagen: rutaPublica(archivo) }),
      },
      select: camposProductoPublico,
    });
    if (archivo) await borrarImagenSubida(actual.imagen);
    return actualizado;
  }

  // Un producto que ya está en algún pedido no se puede borrar (los pedidos lo referencian):
  // se archiva como «eliminado» y deja de verse en el catálogo, los carritos y los favoritos.
  async eliminar(id: number, usuarioId: number) {
    const producto = await this.buscarPropio(id, usuarioId);
    const enPedidos = await this.prisma.detallePedido.count({ where: { productoId: id } });

    if (enPedidos > 0) {
      await this.prisma.$transaction([
        this.prisma.producto.update({ where: { id }, data: { estado: 'eliminado' } }),
        this.prisma.itemCarrito.deleteMany({ where: { productoId: id } }),
        this.prisma.favorito.deleteMany({ where: { productoId: id } }),
      ]);
      return { archivado: true, mensaje: 'La publicación tiene pedidos asociados: se archivó en vez de borrarse.' };
    }

    await this.prisma.producto.delete({ where: { id } });
    await borrarImagenSubida(producto.imagen);
    return { archivado: false, mensaje: 'La publicación se eliminó.' };
  }

  misPublicaciones(usuarioId: number) {
    return this.prisma.producto.findMany({
      where: { vendedorId: usuarioId, estado: { not: 'eliminado' } },
      orderBy: { creadoEn: 'desc' },
      select: camposProductoPublico,
    });
  }

  // Solo el dueño puede modificar una publicación. Una archivada ya no existe para nadie.
  private async buscarPropio(id: number, usuarioId: number) {
    const producto = await this.prisma.producto.findUnique({ where: { id } });
    if (!producto || producto.estado === 'eliminado') {
      throw new NotFoundException('La publicación no existe.');
    }
    if (producto.vendedorId !== usuarioId) {
      throw new ForbiddenException('Solo quien publicó el producto puede modificarlo.');
    }
    return producto;
  }

  private async validarCategoria(categoriaId: number) {
    if (!(await this.categorias.existe(categoriaId))) {
      throw new BadRequestException('La categoría no existe.');
    }
  }

  // Sin stock la publicación queda «agotado» pase lo que pase; con stock vuelve a activo,
  // salvo que el vendedor la haya pausado.
  private estadoSegunStock(
    stock: number,
    pedido: 'activo' | 'pausado' | undefined,
    actual: EstadoProducto,
  ): EstadoProducto {
    if (stock === 0) return 'agotado';
    if (pedido) return pedido;
    return actual === 'agotado' ? 'activo' : actual;
  }
}
