import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEmail, IsOptional, IsString, Length, Matches, MaxLength } from 'class-validator';

const recortar = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value);

export class RegistroDto {
  @ApiProperty({ example: 'Ana Rojas' })
  @Transform(recortar)
  @IsString({ message: 'El nombre debe ser texto.' })
  @Length(2, 80, { message: 'El nombre debe tener entre 2 y 80 caracteres.' })
  nombre: string;

  @ApiProperty({ example: 'ana.rojas@alumnos.cl' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toLowerCase() : value))
  @IsEmail({}, { message: 'El correo no es válido.' })
  @MaxLength(120, { message: 'El correo no puede superar los 120 caracteres.' })
  correo: string;

  @ApiProperty({ example: 'Clave1234', description: 'Al menos 8 caracteres, con una letra y un número' })
  @IsString({ message: 'La contraseña debe ser texto.' })
  @Length(8, 72, { message: 'La contraseña debe tener entre 8 y 72 caracteres.' })
  @Matches(/^(?=.*[A-Za-z])(?=.*\d)/, { message: 'La contraseña debe tener al menos una letra y un número.' })
  contrasena: string;

  @ApiPropertyOptional({ example: 'Ingeniería Civil' })
  @IsOptional()
  @Transform(recortar)
  @IsString({ message: 'La carrera debe ser texto.' })
  @MaxLength(80, { message: 'La carrera no puede superar los 80 caracteres.' })
  carrera?: string;
}
