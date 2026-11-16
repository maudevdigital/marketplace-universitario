import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
  ApiUnprocessableEntityResponse,
} from '@nestjs/swagger';
import { GuardiaSesion, UsuarioActual, UsuarioSesion } from '../auth/sesion';
import { ConversacionesService } from './conversaciones.service';
import { IniciarConversacionDto, MensajeDto } from './dto/conversacion.dto';
import { IdConversacionPipe } from './id-conversacion.pipe';

const ejemploConversacion = {
  id: '6730a1f2c4e5b6a7d8e9f012',
  producto: { id: 9, titulo: 'Guitarra acústica Yamaha FG-331', precio: 145000, imagen: '/imagenes/guitarra1.webp', estado: 'activo' },
  miRol: 'comprador',
  comprador: { id: 10, nombre: 'Estudiante Demo' },
  vendedor: { id: 7, nombre: 'Matías Silva' },
  mensajes: [
    { id: '6730a1f2c4e5b6a7d8e9f013', autorId: 10, texto: '¿Incluye funda?', enviadoEn: '2026-11-10T14:02:00.000Z', leido: true, esMio: true },
    { id: '6730a1f2c4e5b6a7d8e9f014', autorId: 7, texto: 'Sí, una funda blanda.', enviadoEn: '2026-11-10T14:05:00.000Z', leido: true, esMio: false },
  ],
};

// HU-13 (Juan): mensajes entre comprador y vendedor, guardados en MongoDB.
// Importante: GET 'no-leidos' va ANTES que GET ':id', o «no-leidos» se leería como identificador.
@ApiTags('conversaciones')
@ApiBearerAuth()
@ApiUnauthorizedResponse({ description: 'Sin sesión o sesión expirada' })
@UseGuards(GuardiaSesion)
@Controller('conversaciones')
export class ConversacionesController {
  constructor(private readonly conversaciones: ConversacionesService) {}

  @Get()
  @ApiOperation({ summary: 'Mi bandeja: conversaciones como comprador y como vendedor' })
  @ApiOkResponse({
    schema: {
      example: [
        {
          id: '6730a1f2c4e5b6a7d8e9f012',
          producto: { id: 9, titulo: 'Guitarra acústica Yamaha FG-331' },
          miRol: 'comprador',
          otraPersona: { id: 7, nombre: 'Matías Silva' },
          ultimoMensaje: { texto: 'Sí, una funda blanda.', enviadoEn: '2026-11-10T14:05:00.000Z', esMio: false },
          noLeidos: 1,
          ultimoMensajeEn: '2026-11-10T14:05:00.000Z',
        },
      ],
    },
  })
  bandeja(@UsuarioActual() usuario: UsuarioSesion) {
    return this.conversaciones.bandeja(usuario.id);
  }

  @Get('no-leidos')
  @ApiOperation({ summary: 'Cantidad de mensajes sin leer (para el aviso del menú)' })
  @ApiOkResponse({ schema: { example: { total: 2 } } })
  noLeidos(@UsuarioActual() usuario: UsuarioSesion) {
    return this.conversaciones.noLeidos(usuario.id);
  }

  @Post()
  @ApiOperation({ summary: 'Preguntar por un producto (si ya había conversación, se suma a ella)' })
  @ApiCreatedResponse({ schema: { example: ejemploConversacion } })
  @ApiBadRequestResponse({ description: 'Mensaje vacío o de más de 1000 caracteres' })
  @ApiNotFoundResponse({ description: 'La publicación no existe' })
  @ApiUnprocessableEntityResponse({ description: 'Es tu propio producto' })
  iniciar(@UsuarioActual() usuario: UsuarioSesion, @Body() datos: IniciarConversacionDto) {
    return this.conversaciones.iniciar(usuario.id, datos.productoId, datos.texto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Abrir una conversación (marca como leídos los mensajes recibidos)' })
  @ApiOkResponse({ schema: { example: ejemploConversacion } })
  @ApiBadRequestResponse({ description: 'Identificador mal escrito' })
  @ApiForbiddenResponse({ description: 'La conversación es de otras personas' })
  @ApiNotFoundResponse({ description: 'La conversación no existe' })
  detalle(@Param('id', IdConversacionPipe) id: string, @UsuarioActual() usuario: UsuarioSesion) {
    return this.conversaciones.detalle(id, usuario.id);
  }

  @Post(':id/mensajes')
  @ApiOperation({ summary: 'Responder en una conversación' })
  @ApiCreatedResponse({ schema: { example: ejemploConversacion } })
  @ApiBadRequestResponse({ description: 'Mensaje vacío o identificador mal escrito' })
  @ApiForbiddenResponse({ description: 'La conversación es de otras personas' })
  @ApiNotFoundResponse({ description: 'La conversación no existe' })
  responder(
    @Param('id', IdConversacionPipe) id: string,
    @UsuarioActual() usuario: UsuarioSesion,
    @Body() datos: MensajeDto,
  ) {
    return this.conversaciones.responder(id, usuario.id, datos.texto);
  }
}
