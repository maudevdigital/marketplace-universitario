import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsInt, IsString, Length, Min } from 'class-validator';

const recortar = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value);

export class MensajeDto {
  @ApiProperty({ example: 'Sí, incluye la funda. ¿Te acomoda en la biblioteca?' })
  @Transform(recortar)
  @IsString({ message: 'El mensaje debe ser texto.' })
  @Length(1, 1000, { message: 'El mensaje debe tener entre 1 y 1000 caracteres.' })
  texto: string;
}

export class IniciarConversacionDto extends MensajeDto {
  @ApiProperty({ example: 9, description: 'Producto por el que se pregunta' })
  @IsInt({ message: 'El producto no es válido.' })
  @Min(1, { message: 'El producto no es válido.' })
  productoId: number;
}
