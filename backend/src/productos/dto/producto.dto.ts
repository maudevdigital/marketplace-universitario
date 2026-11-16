import { ApiProperty, ApiPropertyOptional, OmitType, PartialType } from '@nestjs/swagger';
import { CondicionProducto } from '@prisma/client';
import { Transform } from 'class-transformer';
import { IsEnum, IsIn, IsInt, IsOptional, IsString, Length, Max, MaxLength, Min } from 'class-validator';
import { numeroOpcional } from '../../comun/transformaciones';

// Los formularios con imagen llegan como multipart: todo viene como texto.
// Estas transformaciones recortan espacios y convierten "" en «sin valor».
const textoLimpio = ({ value }: { value: unknown }) => {
  if (typeof value !== 'string') return value;
  const limpio = value.trim();
  return limpio === '' ? undefined : limpio;
};

export class CrearProductoDto {
  @ApiProperty({ example: 'Calculadora Casio fx-570' })
  @Transform(textoLimpio)
  @IsString({ message: 'El título debe ser texto.' })
  @Length(3, 120, { message: 'El título debe tener entre 3 y 120 caracteres.' })
  titulo: string;

  @ApiProperty({ example: 'Científica, permitida en pruebas. Incluye tapa y manual.' })
  @Transform(textoLimpio)
  @IsString({ message: 'La descripción debe ser texto.' })
  @Length(20, 2000, { message: 'La descripción debe tener entre 20 y 2000 caracteres.' })
  descripcion: string;

  @ApiProperty({ example: 2, description: 'Identificador de la categoría (GET /categorias)' })
  @Transform(numeroOpcional)
  @IsInt({ message: 'La categoría no es válida.' })
  @Min(1, { message: 'La categoría no es válida.' })
  categoriaId: number;

  @ApiProperty({ example: 18000, description: 'Pesos chilenos, sin decimales' })
  @Transform(numeroOpcional)
  @IsInt({ message: 'El precio debe ser un número entero.' })
  @Min(1, { message: 'El precio debe ser mayor que cero.' })
  @Max(100_000_000, { message: 'El precio no puede superar los $100.000.000.' })
  precio: number;

  @ApiProperty({ example: 1 })
  @Transform(numeroOpcional)
  @IsInt({ message: 'El stock debe ser un número entero.' })
  @Min(1, { message: 'Para publicar, el stock debe ser al menos 1.' })
  @Max(999, { message: 'El stock no puede superar las 999 unidades.' })
  stock: number;

  @ApiPropertyOptional({ enum: CondicionProducto, default: CondicionProducto.usado })
  @IsOptional()
  @IsEnum(CondicionProducto, { message: 'La condición debe ser nuevo, como_nuevo o usado.' })
  condicion?: CondicionProducto;

  @ApiPropertyOptional({ example: 'Casio' })
  @IsOptional()
  @Transform(textoLimpio)
  @IsString({ message: 'La marca debe ser texto.' })
  @MaxLength(60, { message: 'La marca no puede superar los 60 caracteres.' })
  marca?: string;

  @ApiPropertyOptional({ example: 'fx-570' })
  @IsOptional()
  @Transform(textoLimpio)
  @IsString({ message: 'El modelo debe ser texto.' })
  @MaxLength(60, { message: 'El modelo no puede superar los 60 caracteres.' })
  modelo?: string;

  // Solo para que Swagger muestre el selector de archivo; el archivo lo procesa multer.
  @ApiPropertyOptional({ type: 'string', format: 'binary', description: 'JPG, PNG o WEBP de hasta 2 MB' })
  @IsOptional()
  imagen?: unknown;
}

export class ActualizarProductoDto extends PartialType(OmitType(CrearProductoDto, ['stock'] as const)) {
  @ApiPropertyOptional({ example: 0, description: 'Con 0 la publicación pasa a «agotado»' })
  @IsOptional()
  @Transform(numeroOpcional)
  @IsInt({ message: 'El stock debe ser un número entero.' })
  @Min(0, { message: 'El stock no puede ser negativo.' })
  @Max(999, { message: 'El stock no puede superar las 999 unidades.' })
  stock?: number;

  @ApiPropertyOptional({ enum: ['activo', 'pausado'], description: 'Pausar oculta la publicación del catálogo' })
  @IsOptional()
  @IsIn(['activo', 'pausado'], { message: 'El estado solo puede cambiarse a activo o pausado.' })
  estado?: 'activo' | 'pausado';
}
