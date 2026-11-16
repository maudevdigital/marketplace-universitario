import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';
import { numeroOpcional } from '../../comun/transformaciones';

export const ORDENES_CATALOGO = ['recientes', 'precio_asc', 'precio_desc'] as const;
export type OrdenCatalogo = (typeof ORDENES_CATALOGO)[number];

// Productos por página del catálogo.
export const POR_PAGINA = 12;

// Los filtros llegan por la dirección (?q=calculo&categoria=1…): todo viene como texto.
// Un parámetro vacío (?q=) se trata como si no estuviera.
const textoOpcional = ({ value }: { value: unknown }) => {
  if (typeof value !== 'string') return value;
  const limpio = value.trim();
  return limpio === '' ? undefined : limpio;
};

export class FiltrosCatalogoDto {
  @ApiPropertyOptional({ example: 'calculadora', description: 'Busca en título, descripción, marca y modelo' })
  @IsOptional()
  @Transform(textoOpcional)
  @IsString({ message: 'La búsqueda debe ser texto.' })
  @MaxLength(100, { message: 'La búsqueda no puede superar los 100 caracteres.' })
  q?: string;

  @ApiPropertyOptional({ example: 2, description: 'Identificador de la categoría' })
  @IsOptional()
  @Transform(numeroOpcional)
  @IsInt({ message: 'La categoría no es válida.' })
  @Min(1, { message: 'La categoría no es válida.' })
  categoria?: number;

  @ApiPropertyOptional({ example: 5000 })
  @IsOptional()
  @Transform(numeroOpcional)
  @IsInt({ message: 'El precio mínimo debe ser un número entero.' })
  @Min(0, { message: 'El precio mínimo no puede ser negativo.' })
  precioMin?: number;

  @ApiPropertyOptional({ example: 50000 })
  @IsOptional()
  @Transform(numeroOpcional)
  @IsInt({ message: 'El precio máximo debe ser un número entero.' })
  @Min(0, { message: 'El precio máximo no puede ser negativo.' })
  precioMax?: number;

  @ApiPropertyOptional({ enum: ORDENES_CATALOGO, default: 'recientes' })
  @IsOptional()
  @Transform(textoOpcional)
  @IsIn(ORDENES_CATALOGO, { message: 'El orden debe ser recientes, precio_asc o precio_desc.' })
  orden?: OrdenCatalogo;

  @ApiPropertyOptional({ example: 1, default: 1 })
  @IsOptional()
  @Transform(numeroOpcional)
  @IsInt({ message: 'La página debe ser un número entero.' })
  @Min(1, { message: 'La página debe ser 1 o mayor.' })
  @Max(10_000, { message: 'La página no es válida.' })
  pagina?: number;
}
