import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional } from 'class-validator';

export const ROLES_PEDIDO = ['comprador', 'vendedor'] as const;
export type RolPedido = (typeof ROLES_PEDIDO)[number];

export class FiltroPedidosDto {
  @ApiPropertyOptional({ enum: ROLES_PEDIDO, default: 'comprador', description: 'comprador: mis compras · vendedor: mis ventas' })
  @IsOptional()
  @IsIn(ROLES_PEDIDO, { message: 'El rol debe ser comprador o vendedor.' })
  rol?: RolPedido;
}
