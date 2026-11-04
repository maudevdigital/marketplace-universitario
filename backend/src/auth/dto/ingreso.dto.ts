import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEmail, IsString, MinLength } from 'class-validator';

export class IngresoDto {
  @ApiProperty({ example: 'demo@alumnos.cl' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toLowerCase() : value))
  @IsEmail({}, { message: 'El correo no es válido.' })
  correo: string;

  @ApiProperty({ example: 'Clave1234' })
  @IsString({ message: 'La contraseña debe ser texto.' })
  @MinLength(1, { message: 'Escribe tu contraseña.' })
  contrasena: string;
}
