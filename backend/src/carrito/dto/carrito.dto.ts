import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

export class CambiarCantidadDto {
  @ApiProperty({ example: 2, description: 'Cantidad final de ese producto en el carrito' })
  @IsInt({ message: 'La cantidad debe ser un número entero.' })
  @Min(1, { message: 'La cantidad debe ser al menos 1. Para sacar el producto, elimínalo del carrito.' })
  @Max(999, { message: 'La cantidad no puede superar las 999 unidades.' })
  cantidad: number;
}

export class AgregarItemDto {
  @ApiProperty({ example: 9 })
  @IsInt({ message: 'El producto no es válido.' })
  @Min(1, { message: 'El producto no es válido.' })
  productoId: number;

  @ApiPropertyOptional({ example: 1, default: 1, description: 'Se suma a lo que ya haya en el carrito' })
  @IsOptional()
  @IsInt({ message: 'La cantidad debe ser un número entero.' })
  @Min(1, { message: 'La cantidad debe ser al menos 1.' })
  @Max(999, { message: 'La cantidad no puede superar las 999 unidades.' })
  cantidad?: number;
}
