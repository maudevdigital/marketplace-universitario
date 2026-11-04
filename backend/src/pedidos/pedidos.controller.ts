import { Body, Controller, Get, HttpCode, Param, Post, Query, UseGuards } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiUnauthorizedResponse,
  ApiUnprocessableEntityResponse,
} from '@nestjs/swagger';
import { GuardiaSesion, UsuarioActual, UsuarioSesion } from '../auth/sesion';
import { IdPipe } from '../comun/id.pipe';
import { PagarPedidoDto } from './dto/pago.dto';
import { FiltroPedidosDto } from './dto/pedidos.dto';
import { PagosService } from './pagos.service';
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
  constructor(
    private readonly pedidos: PedidosService,
    private readonly pagos: PagosService,
  ) {}

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

  // HU-12: pago simulado y cambios de estado. Todas devuelven el pedido actualizado.

  @Post(':id/pago')
  @HttpCode(200)
  @ApiOperation({ summary: 'Pagar un pedido pendiente (simulado): 4242 4242 4242 4242 se aprueba, 4000 0000 0000 0002 se rechaza' })
  @ApiOkResponse({
    schema: {
      example: {
        ...ejemploPedido,
        estado: 'pagado',
        miRol: 'comprador',
        pagos: [{ id: 1, monto: 85000, estado: 'aprobado', comprobante: 'PAGO-1A2B3C4D5E6F', creadoEn: '2026-11-10T14:05:00.000Z' }],
      },
    },
  })
  @ApiBadRequestResponse({ description: 'Datos de tarjeta inválidos, vencida o que no es de prueba' })
  @ApiResponse({ status: 402, description: 'Pago rechazado (queda registrado; el pedido sigue pendiente)' })
  @ApiForbiddenResponse({ description: 'Solo quien compró puede pagar' })
  @ApiConflictResponse({ description: 'El pedido no está pendiente' })
  pagar(@Param('id', IdPipe) id: number, @UsuarioActual() usuario: UsuarioSesion, @Body() datos: PagarPedidoDto) {
    return this.pagos.pagar(id, usuario.id, datos);
  }

  @Post(':id/entrega')
  @HttpCode(200)
  @ApiOperation({ summary: 'El vendedor marca como entregado un pedido pagado' })
  @ApiOkResponse({ schema: { example: { ...ejemploPedido, estado: 'entregado', miRol: 'vendedor', pagos: [] } } })
  @ApiForbiddenResponse({ description: 'Solo quien vende puede marcar la entrega' })
  @ApiConflictResponse({ description: 'El pedido no está pagado' })
  entregar(@Param('id', IdPipe) id: number, @UsuarioActual() usuario: UsuarioSesion) {
    return this.pagos.entregar(id, usuario.id);
  }

  @Post(':id/cancelacion')
  @HttpCode(200)
  @ApiOperation({ summary: 'Cancelar un pedido pendiente o pagado: devuelve el stock y reactiva lo agotado' })
  @ApiOkResponse({ schema: { example: { ...ejemploPedido, estado: 'cancelado', miRol: 'comprador', pagos: [] } } })
  @ApiForbiddenResponse({ description: 'El pedido es de otras personas' })
  @ApiConflictResponse({ description: 'El pedido ya se entregó o ya estaba cancelado' })
  cancelar(@Param('id', IdPipe) id: number, @UsuarioActual() usuario: UsuarioSesion) {
    return this.pagos.cancelar(id, usuario.id);
  }
}
