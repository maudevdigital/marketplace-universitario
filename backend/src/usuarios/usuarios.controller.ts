import { Controller, Get, Param } from '@nestjs/common';
import { ApiNotFoundResponse, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { IdPipe } from '../comun/id.pipe';
import { UsuariosService } from './usuarios.service';

@ApiTags('usuarios')
@Controller('usuarios')
export class UsuariosController {
  constructor(private readonly usuarios: UsuariosService) {}

  @Get(':id')
  @ApiOperation({ summary: 'Perfil público de un vendedor y sus publicaciones activas' })
  @ApiOkResponse({
    schema: {
      example: {
        id: 1,
        nombre: 'Camila Rojas',
        carrera: 'Ingeniería Civil',
        creadoEn: '2026-11-04T12:00:00.000Z',
        publicaciones: [{ id: 1, titulo: 'Stewart - Calculus: Early Vectors', precio: 25000 }],
      },
    },
  })
  @ApiNotFoundResponse({ description: 'El usuario no existe' })
  perfil(@Param('id', IdPipe) id: number) {
    return this.usuarios.perfilPublico(id);
  }
}
