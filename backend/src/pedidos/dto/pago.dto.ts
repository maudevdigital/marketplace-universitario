import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsString, Length, Matches } from 'class-validator';

const sinEspacios = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.replace(/[\s-]/g, '') : value);
const recortar = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value);

// Pago simulado: estos datos solo se validan, nunca se guardan (la tabla pagos no tiene columnas de tarjeta).
export class PagarPedidoDto {
  @ApiProperty({ example: '4242 4242 4242 4242', description: '4242 4242 4242 4242 se aprueba · 4000 0000 0000 0002 se rechaza' })
  @Transform(sinEspacios)
  @IsString({ message: 'El número de tarjeta debe ser texto.' })
  @Matches(/^\d{16}$/, { message: 'El número de tarjeta debe tener 16 dígitos.' })
  numeroTarjeta: string;

  @ApiProperty({ example: 'Estudiante Demo' })
  @Transform(recortar)
  @IsString({ message: 'El nombre del titular debe ser texto.' })
  @Length(3, 80, { message: 'El nombre del titular debe tener entre 3 y 80 caracteres.' })
  titular: string;

  @ApiProperty({ example: '12/28', description: 'MM/AA' })
  @Transform(recortar)
  @IsString({ message: 'El vencimiento debe ser texto.' })
  @Matches(/^(0[1-9]|1[0-2])\/\d{2}$/, { message: 'El vencimiento debe tener el formato MM/AA.' })
  vencimiento: string;

  @ApiProperty({ example: '123' })
  @Transform(recortar)
  @IsString({ message: 'El código de seguridad debe ser texto.' })
  @Matches(/^\d{3,4}$/, { message: 'El código de seguridad debe tener 3 o 4 dígitos.' })
  cvv: string;
}
