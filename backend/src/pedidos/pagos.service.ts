import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { randomBytes } from 'node:crypto';
import { PrismaService } from '../comun/prisma/prisma.service';
import { PagarPedidoDto } from './dto/pago.dto';
import { PedidosService } from './pedidos.service';

// Tarjetas de prueba. No hay conexión con ningún medio de pago real.
export const TARJETA_APROBADA = '4242424242424242';
export const TARJETA_RECHAZADA = '4000000000000002';

// HU-12: pago simulado y cambios de estado del pedido.
//   pendiente → pagado → entregado · cancelado solo desde pendiente o pagado.
// Cada cambio se hace con «actualiza solo si sigue en el estado esperado»: si dos pestañas
// pagan o cancelan a la vez, una gana y la otra recibe 409.
@Injectable()
export class PagosService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly pedidos: PedidosService,
  ) {}

  async pagar(pedidoId: number, usuarioId: number, datos: PagarPedidoDto) {
    const pedido = await this.pedidos.detalle(pedidoId, usuarioId);
    if (pedido.miRol !== 'comprador') {
      throw new ForbiddenException('Solo quien compró puede pagar el pedido.');
    }
    if (pedido.estado !== 'pendiente') {
      throw new ConflictException(`El pedido ya está ${pedido.estado}: no se puede pagar.`);
    }
    this.validarVencimiento(datos.vencimiento);

    if (datos.numeroTarjeta === TARJETA_RECHAZADA) {
      // El intento rechazado queda registrado; el pedido sigue pendiente y se puede reintentar.
      await this.prisma.pago.create({
        data: { pedidoId, monto: pedido.total, estado: 'rechazado', comprobante: this.comprobante() },
      });
      throw new HttpException(
        'El banco rechazó el pago. No se hizo ningún cargo: prueba con otra tarjeta.',
        HttpStatus.PAYMENT_REQUIRED,
      );
    }
    if (datos.numeroTarjeta !== TARJETA_APROBADA) {
      throw new BadRequestException(
        'Este pago es simulado: usa 4242 4242 4242 4242 (se aprueba) o 4000 0000 0000 0002 (se rechaza).',
      );
    }

    await this.prisma.$transaction(async (tx) => {
      const cambio = await tx.pedido.updateMany({
        where: { id: pedidoId, estado: 'pendiente' },
        data: { estado: 'pagado' },
      });
      if (cambio.count === 0) throw new ConflictException('El pedido cambió de estado mientras pagabas. Revisa el pedido.');
      // El índice único parcial de la base impide un segundo pago aprobado aunque algo falle aquí.
      await tx.pago.create({
        data: { pedidoId, monto: pedido.total, estado: 'aprobado', comprobante: this.comprobante() },
      });
    });
    return this.pedidos.detalle(pedidoId, usuarioId);
  }

  // Solo el vendedor confirma la entrega, y solo de un pedido pagado.
  async entregar(pedidoId: number, usuarioId: number) {
    const pedido = await this.pedidos.detalle(pedidoId, usuarioId);
    if (pedido.miRol !== 'vendedor') {
      throw new ForbiddenException('Solo quien vende puede marcar el pedido como entregado.');
    }
    const cambio = await this.prisma.pedido.updateMany({
      where: { id: pedidoId, estado: 'pagado' },
      data: { estado: 'entregado' },
    });
    if (cambio.count === 0) {
      throw new ConflictException(
        pedido.estado === 'pendiente'
          ? 'El pedido todavía no está pagado: no se puede marcar como entregado.'
          : `El pedido ya está ${pedido.estado}.`,
      );
    }
    return this.pedidos.detalle(pedidoId, usuarioId);
  }

  // Comprador o vendedor cancelan antes de la entrega. El stock vuelve a las publicaciones
  // y lo que se había agotado por esta compra vuelve al catálogo.
  async cancelar(pedidoId: number, usuarioId: number) {
    const pedido = await this.pedidos.detalle(pedidoId, usuarioId);

    await this.prisma.$transaction(async (tx) => {
      const cambio = await tx.pedido.updateMany({
        where: { id: pedidoId, estado: { in: ['pendiente', 'pagado'] } },
        data: { estado: 'cancelado' },
      });
      if (cambio.count === 0) {
        throw new ConflictException(
          pedido.estado === 'entregado'
            ? 'El pedido ya se entregó: no se puede cancelar.'
            : 'El pedido ya estaba cancelado.',
        );
      }
      for (const detalle of pedido.detalles) {
        await tx.producto.update({
          where: { id: detalle.producto.id },
          data: { stock: { increment: detalle.cantidad } },
        });
        // Solo se reactiva lo agotado: lo pausado o eliminado por el vendedor se respeta.
        await tx.producto.updateMany({
          where: { id: detalle.producto.id, estado: 'agotado', stock: { gt: 0 } },
          data: { estado: 'activo' },
        });
      }
    });
    return this.pedidos.detalle(pedidoId, usuarioId);
  }

  private validarVencimiento(vencimiento: string) {
    const [mes, anio] = vencimiento.split('/').map(Number);
    const hoy = new Date();
    const fin = new Date(2000 + anio, mes, 1); // primer día del mes siguiente al vencimiento
    if (fin <= hoy) throw new BadRequestException('La tarjeta está vencida.');
  }

  // Código legible y único para el comprobante, por ejemplo «PAGO-1A2B3C4D5E6F».
  private comprobante() {
    return `PAGO-${randomBytes(6).toString('hex').toUpperCase()}`;
  }
}
