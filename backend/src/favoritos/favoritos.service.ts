import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../comun/prisma/prisma.service';
import { camposProductoPublico } from '../productos/campos-producto';

// HU-09: favoritos. Marcar y desmarcar son idempotentes: repetir la acción no es un error,
// así un doble clic o una pestaña desactualizada no muestran mensajes confusos.
@Injectable()
export class FavoritosService {
  constructor(private readonly prisma: PrismaService) {}

  // Incluye pausados y agotados (con su estado) para que la persona sepa qué pasó con ellos.
  // Los eliminados no aparecen: al archivar un producto se borran sus favoritos.
  async listar(usuarioId: number) {
    const favoritos = await this.prisma.favorito.findMany({
      where: { usuarioId, producto: { estado: { not: 'eliminado' } } },
      orderBy: { creadoEn: 'desc' },
      select: { creadoEn: true, producto: { select: camposProductoPublico } },
    });
    return favoritos.map(({ creadoEn, producto }) => ({ ...producto, marcadoEn: creadoEn }));
  }

  async marcar(usuarioId: number, productoId: number) {
    const producto = await this.prisma.producto.findUnique({ where: { id: productoId }, select: { estado: true } });
    if (!producto || producto.estado === 'eliminado') {
      throw new NotFoundException('La publicación no existe.');
    }
    await this.prisma.favorito.upsert({
      where: { usuarioId_productoId: { usuarioId, productoId } },
      create: { usuarioId, productoId },
      update: {},
    });
    return { productoId, favorito: true };
  }

  async desmarcar(usuarioId: number, productoId: number) {
    await this.prisma.favorito.deleteMany({ where: { usuarioId, productoId } });
    return { productoId, favorito: false };
  }
}
