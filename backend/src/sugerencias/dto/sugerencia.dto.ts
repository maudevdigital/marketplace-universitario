import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsString, Length } from 'class-validator';

export class SugerenciaProductoDto {
  @ApiProperty({ example: 'calculadora casio fx-570', description: 'El título que va escribiendo el vendedor' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString({ message: 'El título debe ser texto.' })
  @Length(4, 120, { message: 'Escribe al menos 4 caracteres del título para recibir sugerencias.' })
  titulo: string;
}
