import { Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiConflictResponse,
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
import { IdPipe } from '../comun/id.pipe';
import { FiltroPedidosDto } from './dto/pedidos.dto';
import { PedidosService } from './pedidos.service';

const ejemploPedido = {
  id: 1,
  estado: 'pendiente',
  total: 85000,
  creadoEn: '2026-11-10T14:00:00.000Z',
  actualizadoEn: '2026-11-10T14:00:00.000Z',
  comprador: { id: 10, nombre: 'Estudiante Demo', carrera: 'Ingeniería en Computación' },
  vendedor: { id: 7, nombre: 'Matías Silva', carrera: 'Pedagogía en Música' },
  detalles: [
    {
      id: 1,
      cantidad: 1,
      precioUnitario: 85000,
      subtotal: 85000,
      producto: { id: 9, titulo: 'Guitarra acústica Yamaha FG-331', imagen: '/imagenes/guitarra1.webp' },
    },
  ],
};

@ApiTags('pedidos')
@ApiBearerAuth()
@ApiUnauthorizedResponse({ description: 'Sin sesión o sesión expirada' })
@UseGuards(GuardiaSesion)
@Controller('pedidos')
export class PedidosController {
  constructor(private readonly pedidos: PedidosService) {}

  @Post()
  @ApiOperation({
    summary: 'Comprar todo el carrito: un pedido por vendedor, descontando el stock en una sola transacción',
  })
  @ApiCreatedResponse({ schema: { example: [ejemploPedido] } })
  @ApiConflictResponse({ description: 'Algún producto ya no tiene stock o no está disponible (no se crea ningún pedido)' })
  @ApiUnprocessableEntityResponse({ description: 'El carrito está vacío o tiene un producto propio' })
  comprar(@UsuarioActual() usuario: UsuarioSesion) {
    return this.pedidos.comprarCarrito(usuario.id);
  }

  @Get()
  @ApiOperation({ summary: 'Mis compras (rol=comprador) o mis ventas (rol=vendedor), de la más reciente a la más antigua' })
  @ApiOkResponse({ schema: { example: [ejemploPedido] } })
  listar(@UsuarioActual() usuario: UsuarioSesion, @Query() filtro: FiltroPedidosDto) {
    return this.pedidos.listar(usuario.id, filtro.rol);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Detalle de un pedido con sus pagos; solo para quien compró o quien vende' })
  @ApiOkResponse({ schema: { example: { ...ejemploPedido, pagos: [], miRol: 'comprador' } } })
  @ApiForbiddenResponse({ description: 'El pedido es de otras personas' })
  @ApiNotFoundResponse({ description: 'El pedido no existe' })
  detalle(@Param('id', IdPipe) id: number, @UsuarioActual() usuario: UsuarioSesion) {
    return this.pedidos.detalle(id, usuario.id);
  }
}
