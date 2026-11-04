import { Controller, Delete, Get, Param, Post, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { GuardiaSesion, UsuarioActual, UsuarioSesion } from '../auth/sesion';
import { IdPipe } from '../comun/id.pipe';
import { FavoritosService } from './favoritos.service';

@ApiTags('favoritos')
@ApiBearerAuth()
@ApiUnauthorizedResponse({ description: 'Sin sesión o sesión expirada' })
@UseGuards(GuardiaSesion)
@Controller('favoritos')
export class FavoritosController {
  constructor(private readonly favoritos: FavoritosService) {}

  @Get()
  @ApiOperation({ summary: 'Mis favoritos, del más reciente al más antiguo' })
  @ApiOkResponse({
    schema: {
      example: [{ id: 9, titulo: 'Guitarra acústica Yamaha FG-331', precio: 85000, estado: 'activo', marcadoEn: '2026-11-10T14:02:00.000Z' }],
    },
  })
  listar(@UsuarioActual() usuario: UsuarioSesion) {
    return this.favoritos.listar(usuario.id);
  }

  @Post(':productoId')
  @ApiOperation({ summary: 'Marcar un producto como favorito (si ya lo era, no pasa nada)' })
  @ApiCreatedResponse({ schema: { example: { productoId: 9, favorito: true } } })
  @ApiNotFoundResponse({ description: 'La publicación no existe' })
  marcar(@UsuarioActual() usuario: UsuarioSesion, @Param('productoId', IdPipe) productoId: number) {
    return this.favoritos.marcar(usuario.id, productoId);
  }

  @Delete(':productoId')
  @ApiOperation({ summary: 'Quitar un producto de favoritos (si no lo era, no pasa nada)' })
  @ApiOkResponse({ schema: { example: { productoId: 9, favorito: false } } })
  desmarcar(@UsuarioActual() usuario: UsuarioSesion, @Param('productoId', IdPipe) productoId: number) {
    return this.favoritos.desmarcar(usuario.id, productoId);
  }
}
