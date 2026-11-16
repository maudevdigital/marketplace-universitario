import { Injectable } from '@nestjs/common';
import { PrismaService } from '../comun/prisma/prisma.service';

@Injectable()
export class CategoriasService {
  constructor(private readonly prisma: PrismaService) {}

  async listar() {
    const categorias = await this.prisma.categoria.findMany({
      orderBy: { id: 'asc' },
      include: { _count: { select: { productos: { where: { estado: 'activo' } } } } },
    });
    return categorias.map(({ _count, ...categoria }) => ({
      ...categoria,
      productosActivos: _count.productos,
    }));
  }

  async existe(id: number) {
    return (await this.prisma.categoria.count({ where: { id } })) > 0;
  }
}
