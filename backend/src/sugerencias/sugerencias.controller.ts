import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiServiceUnavailableResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { GuardiaSesion } from '../auth/sesion';
import { SugerenciaProductoDto } from './dto/sugerencia.dto';
import { SugerenciasService } from './sugerencias.service';

// HU-08 (Juan): autocompletar la publicación con el predictor de categorías de Mercado Libre.
// Con candado: solo quien está publicando necesita sugerencias (y así nadie la usa para
// gastar consultas a Mercado Libre desde afuera).
@ApiTags('sugerencias')
@ApiBearerAuth()
@ApiUnauthorizedResponse({ description: 'Sin sesión o sesión expirada' })
@UseGuards(GuardiaSesion)
@Controller('sugerencias')
export class SugerenciasController {
  constructor(private readonly sugerencias: SugerenciasService) {}

  @Get('producto')
  @ApiOperation({ summary: 'Sugerir categoría, marca y modelo a partir del título (predictor de Mercado Libre)' })
  @ApiOkResponse({
    schema: {
      example: {
        titulo: 'Audífonos Sony WH-CH720N',
        encontrada: true,
        categoria: { id: 3, nombre: 'Accesorios' },
        categoriaMercadoLibre: { dominio: 'MLC-HEADPHONES', nombre: 'Audífonos', principal: null },
        marca: 'Sony',
        modelo: 'WH-CH720N',
      },
    },
  })
  @ApiBadRequestResponse({ description: 'Título de menos de 4 caracteres' })
  @ApiServiceUnavailableResponse({ description: 'Mercado Libre no respondió: se completa a mano' })
  sugerir(@Query() datos: SugerenciaProductoDto) {
    return this.sugerencias.sugerir(datos.titulo);
  }
}
