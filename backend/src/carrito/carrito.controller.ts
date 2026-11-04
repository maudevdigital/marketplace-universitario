import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
  ApiUnprocessableEntityResponse,
} from '@nestjs/swagger';
import { GuardiaSesion, UsuarioActual, UsuarioSesion } from '../auth/sesion';
import { IdPipe } from '../comun/id.pipe';
import { CarritoService } from './carrito.service';
import { AgregarItemDto, CambiarCantidadDto } from './dto/carrito.dto';

const ejemploCarrito = {
  items: [
    {
      producto: { id: 9, titulo: 'Guitarra acústica Yamaha FG-331', precio: 85000, stock: 1, estado: 'activo' },
      cantidad: 1,
      subtotal: 85000,
      problema: null,
    },
  ],
  unidades: 1,
  total: 85000,
  pedidosAGenerar: 1,
  sePuedeComprar: true,
};

// Todas las acciones devuelven el carrito completo, así la pantalla se actualiza con una sola respuesta.
@ApiTags('carrito')
@ApiBearerAuth()
@ApiUnauthorizedResponse({ description: 'Sin sesión o sesión expirada' })
@UseGuards(GuardiaSesion)
@Controller('carrito')
export class CarritoController {
  constructor(private readonly carrito: CarritoService) {}

  @Get()
  @ApiOperation({ summary: 'Mi carrito; cada ítem indica si hoy se puede comprar (campo «problema»)' })
  @ApiOkResponse({ schema: { example: ejemploCarrito } })
  obtener(@UsuarioActual() usuario: UsuarioSesion) {
    return this.carrito.obtener(usuario.id);
  }

  @Post('items')
  @ApiOperation({ summary: 'Agregar un producto (suma a lo que ya había), sin pasar el stock' })
  @ApiCreatedResponse({ schema: { example: ejemploCarrito } })
  @ApiBadRequestResponse({ description: 'Datos inválidos' })
  @ApiNotFoundResponse({ description: 'La publicación no existe' })
  @ApiConflictResponse({ description: 'No hay stock suficiente o la publicación no está activa' })
  @ApiUnprocessableEntityResponse({ description: 'Es un producto propio' })
  agregar(@UsuarioActual() usuario: UsuarioSesion, @Body() datos: AgregarItemDto) {
    return this.carrito.agregar(usuario.id, datos.productoId, datos.cantidad);
  }

  @Patch('items/:productoId')
  @ApiOperation({ summary: 'Cambiar la cantidad de un producto del carrito' })
  @ApiOkResponse({ schema: { example: ejemploCarrito } })
  @ApiNotFoundResponse({ description: 'El producto no está en el carrito' })
  @ApiConflictResponse({ description: 'No hay stock suficiente o la publicación no está activa' })
  cambiarCantidad(
    @UsuarioActual() usuario: UsuarioSesion,
    @Param('productoId', IdPipe) productoId: number,
    @Body() datos: CambiarCantidadDto,
  ) {
    return this.carrito.cambiarCantidad(usuario.id, productoId, datos.cantidad);
  }

  @Delete('items/:productoId')
  @ApiOperation({ summary: 'Sacar un producto del carrito' })
  @ApiOkResponse({ schema: { example: ejemploCarrito } })
  quitar(@UsuarioActual() usuario: UsuarioSesion, @Param('productoId', IdPipe) productoId: number) {
    return this.carrito.quitar(usuario.id, productoId);
  }

  @Delete()
  @ApiOperation({ summary: 'Vaciar el carrito' })
  @ApiOkResponse({ schema: { example: { items: [], unidades: 0, total: 0, pedidosAGenerar: 0, sePuedeComprar: false } } })
  vaciar(@UsuarioActual() usuario: UsuarioSesion) {
    return this.carrito.vaciar(usuario.id);
  }
}
