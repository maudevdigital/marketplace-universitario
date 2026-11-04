import {
  CanActivate,
  createParamDecorator,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';

// Lo que viaja dentro del token de sesión (firmado, no cifrado: nada secreto aquí).
export interface UsuarioSesion {
  id: number;
  nombre: string;
}

interface PeticionConSesion extends Request {
  usuario?: UsuarioSesion;
}

// Guardia para las rutas con candado: exige «Authorization: Bearer <token>».
// Uso: @UseGuards(GuardiaSesion) en el controlador o en un método.
@Injectable()
export class GuardiaSesion implements CanActivate {
  constructor(private readonly jwt: JwtService) {}

  async canActivate(contexto: ExecutionContext): Promise<boolean> {
    const peticion = contexto.switchToHttp().getRequest<PeticionConSesion>();
    const [tipo, token] = peticion.headers.authorization?.split(' ') ?? [];
    if (tipo !== 'Bearer' || !token) {
      throw new UnauthorizedException('Debes iniciar sesión.');
    }
    try {
      const datos = await this.jwt.verifyAsync<{ sub: number; nombre: string }>(token);
      peticion.usuario = { id: datos.sub, nombre: datos.nombre };
      return true;
    } catch {
      throw new UnauthorizedException('Tu sesión expiró. Vuelve a iniciar sesión.');
    }
  }
}

// Entrega el usuario de la sesión a un método del controlador: @UsuarioActual() usuario
export const UsuarioActual = createParamDecorator(
  (_dato: unknown, contexto: ExecutionContext): UsuarioSesion =>
    contexto.switchToHttp().getRequest<PeticionConSesion>().usuario!,
);
