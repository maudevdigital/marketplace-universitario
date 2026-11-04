import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../comun/prisma/prisma.service';
import { camposProductoPublico } from '../productos/campos-producto';

@Injectable()
export class UsuariosService {
  constructor(private readonly prisma: PrismaService) {}

  // Perfil público del vendedor: sin correo (el contacto va por las conversaciones, HU-13).
  async perfilPublico(id: number) {
    const usuario = await this.prisma.usuario.findUnique({
      where: { id },
      select: {
        id: true,
        nombre: true,
        carrera: true,
        creadoEn: true,
        productos: {
          where: { estado: 'activo' },
          orderBy: { creadoEn: 'desc' },
          select: camposProductoPublico,
        },
      },
    });
    if (!usuario) throw new NotFoundException('El usuario no existe.');
    const { productos, ...datos } = usuario;
    return { ...datos, publicaciones: productos };
  }
}
