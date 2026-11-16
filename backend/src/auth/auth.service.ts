import { ConflictException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../comun/prisma/prisma.service';
import { IngresoDto } from './dto/ingreso.dto';
import { RegistroDto } from './dto/registro.dto';

// Campos del usuario que se pueden mostrar: nunca el hash de la contraseña.
export const camposUsuario = { id: true, nombre: true, correo: true, carrera: true, creadoEn: true } as const;

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  async registrar(datos: RegistroDto) {
    const existe = await this.prisma.usuario.findUnique({ where: { correo: datos.correo } });
    if (existe) {
      throw new ConflictException('Ya existe una cuenta con ese correo.');
    }
    const usuario = await this.prisma.usuario.create({
      data: {
        nombre: datos.nombre,
        correo: datos.correo,
        carrera: datos.carrera || null,
        hashContrasena: await bcrypt.hash(datos.contrasena, 10),
      },
      select: camposUsuario,
    });
    return this.sesionPara(usuario);
  }

  async ingresar(datos: IngresoDto) {
    const usuario = await this.prisma.usuario.findUnique({ where: { correo: datos.correo } });
    // Mismo mensaje si el correo no existe o si la contraseña falla:
    // así no se puede averiguar qué correos tienen cuenta.
    const valido = usuario && (await bcrypt.compare(datos.contrasena, usuario.hashContrasena));
    if (!usuario || !valido) {
      throw new UnauthorizedException('Correo o contraseña incorrectos.');
    }
    const { hashContrasena: _omitido, ...publico } = usuario;
    return this.sesionPara(publico);
  }

  async obtenerUsuario(id: number) {
    const usuario = await this.prisma.usuario.findUnique({ where: { id }, select: camposUsuario });
    if (!usuario) throw new NotFoundException('El usuario de la sesión ya no existe.');
    return usuario;
  }

  private async sesionPara(usuario: { id: number; nombre: string }) {
    const token = await this.jwt.signAsync({ sub: usuario.id, nombre: usuario.nombre });
    return { token, usuario };
  }
}
