import { Body, Controller, Get, HttpCode, Post, UseGuards } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { IngresoDto } from './dto/ingreso.dto';
import { RegistroDto } from './dto/registro.dto';
import { GuardiaSesion, UsuarioActual, UsuarioSesion } from './sesion';

const ejemploSesion = {
  token: 'eyJhbGciOiJIUzI1NiIs…',
  usuario: { id: 10, nombre: 'Estudiante Demo', correo: 'demo@alumnos.cl', carrera: 'Ingeniería en Computación' },
};

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('registro')
  @ApiOperation({ summary: 'Crear una cuenta (sirve para comprar y vender)' })
  @ApiCreatedResponse({ schema: { example: ejemploSesion } })
  @ApiBadRequestResponse({ description: 'Datos inválidos' })
  @ApiConflictResponse({ description: 'El correo ya tiene cuenta' })
  registrar(@Body() datos: RegistroDto) {
    return this.auth.registrar(datos);
  }

  @Post('ingreso')
  @HttpCode(200)
  @ApiOperation({ summary: 'Iniciar sesión y recibir el token' })
  @ApiOkResponse({ schema: { example: ejemploSesion } })
  @ApiUnauthorizedResponse({ description: 'Correo o contraseña incorrectos' })
  ingresar(@Body() datos: IngresoDto) {
    return this.auth.ingresar(datos);
  }

  @Get('yo')
  @UseGuards(GuardiaSesion)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Usuario de la sesión actual' })
  @ApiOkResponse({ schema: { example: ejemploSesion.usuario } })
  @ApiUnauthorizedResponse({ description: 'Sin sesión o sesión expirada' })
  yo(@UsuarioActual() usuario: UsuarioSesion) {
    return this.auth.obtenerUsuario(usuario.id);
  }
}
