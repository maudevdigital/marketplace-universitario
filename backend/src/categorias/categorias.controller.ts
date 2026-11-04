import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CategoriasService } from './categorias.service';

@ApiTags('categorias')
@Controller('categorias')
export class CategoriasController {
  constructor(private readonly categorias: CategoriasService) {}

  @Get()
  @ApiOperation({ summary: 'Categorías con la cantidad de productos activos de cada una' })
  @ApiOkResponse({ schema: { example: [{ id: 1, nombre: 'Libros', icono: 'book', productosActivos: 3 }] } })
  listar() {
    return this.categorias.listar();
  }
}
