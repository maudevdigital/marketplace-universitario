import {
  applyDecorators,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { GuardiaSesion, UsuarioActual, UsuarioSesion } from '../auth/sesion';
import { IdPipe } from '../comun/id.pipe';
import { opcionesImagen } from '../comun/imagenes';
import { FiltrosCatalogoDto } from './dto/catalogo.dto';
import { ActualizarProductoDto, CrearProductoDto } from './dto/producto.dto';
import { ProductosService } from './productos.service';

const ejemploProducto = {
  id: 13,
  titulo: 'Calculadora Casio fx-570',
  descripcion: 'Científica, permitida en pruebas. Incluye tapa y manual.',
  marca: 'Casio',
  modelo: 'fx-570',
  condicion: 'usado',
  precio: 18000,
  stock: 1,
  estado: 'activo',
  imagen: '/imagenes/3f1c…webp',
  creadoEn: '2026-11-04T15:00:00.000Z',
  categoria: { id: 2, nombre: 'Tecnología' },
  vendedor: { id: 10, nombre: 'Estudiante Demo', carrera: 'Ingeniería en Computación' },
};

// HU-05 (Lucas): publicar, editar, eliminar y «mis publicaciones».
// HU-06 (Matías): GET /productos (catálogo con filtros) y GET /productos/:id, sin candado.
// Importante: GET 'mios' tiene que quedar declarado ANTES que GET ':id',
// o Nest intentará leer «mios» como un número.
// Las rutas de esta historia llevan candado una por una (@Autenticado), porque las de
// HU-06 son públicas: cualquiera puede ver el catálogo sin iniciar sesión.
const Autenticado = () =>
  applyDecorators(
    UseGuards(GuardiaSesion),
    ApiBearerAuth(),
    ApiUnauthorizedResponse({ description: 'Sin sesión o sesión expirada' }),
  );

@ApiTags('productos')
@Controller('productos')
export class ProductosController {
  constructor(private readonly productos: ProductosService) {}

  @Get('mios')
  @Autenticado()
  @ApiOperation({ summary: 'Mis publicaciones (activas, pausadas y agotadas)' })
  @ApiOkResponse({ schema: { example: [ejemploProducto] } })
  mios(@UsuarioActual() usuario: UsuarioSesion) {
    return this.productos.misPublicaciones(usuario.id);
  }

  @Get()
  @ApiOperation({ summary: 'Catálogo público de publicaciones activas, con búsqueda, filtros y páginas' })
  @ApiOkResponse({
    schema: { example: { productos: [ejemploProducto], total: 1, pagina: 1, porPagina: 12, totalPaginas: 1 } },
  })
  @ApiBadRequestResponse({ description: 'Filtros inválidos (por ejemplo, precio mínimo mayor que el máximo)' })
  catalogo(@Query() filtros: FiltrosCatalogoDto) {
    return this.productos.catalogo(filtros);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Detalle público de una publicación, con los datos del vendedor' })
  @ApiOkResponse({ schema: { example: ejemploProducto } })
  @ApiNotFoundResponse({ description: 'La publicación no existe o fue eliminada' })
  detalle(@Param('id', IdPipe) id: number) {
    return this.productos.detalle(id);
  }

  @Post()
  @Autenticado()
  @UseInterceptors(FileInterceptor('imagen', opcionesImagen))
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: CrearProductoDto })
  @ApiOperation({ summary: 'Publicar un producto (la imagen es opcional)' })
  @ApiCreatedResponse({ schema: { example: ejemploProducto } })
  @ApiBadRequestResponse({ description: 'Datos inválidos, categoría inexistente o imagen no permitida' })
  crear(
    @UsuarioActual() usuario: UsuarioSesion,
    @Body() datos: CrearProductoDto,
    @UploadedFile() archivo?: Express.Multer.File,
  ) {
    return this.productos.crear(usuario.id, datos, archivo);
  }

  @Patch(':id')
  @Autenticado()
  @UseInterceptors(FileInterceptor('imagen', opcionesImagen))
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: ActualizarProductoDto })
  @ApiOperation({ summary: 'Editar una publicación propia (solo los campos enviados)' })
  @ApiOkResponse({ schema: { example: ejemploProducto } })
  @ApiBadRequestResponse({ description: 'Datos inválidos' })
  @ApiForbiddenResponse({ description: 'La publicación es de otra persona' })
  @ApiNotFoundResponse({ description: 'La publicación no existe' })
  actualizar(
    @Param('id', IdPipe) id: number,
    @UsuarioActual() usuario: UsuarioSesion,
    @Body() datos: ActualizarProductoDto,
    @UploadedFile() archivo?: Express.Multer.File,
  ) {
    return this.productos.actualizar(id, usuario.id, datos, archivo);
  }

  @Delete(':id')
  @Autenticado()
  @ApiOperation({ summary: 'Eliminar una publicación propia (se archiva si ya tiene pedidos)' })
  @ApiOkResponse({ schema: { example: { archivado: false, mensaje: 'La publicación se eliminó.' } } })
  @ApiForbiddenResponse({ description: 'La publicación es de otra persona' })
  @ApiNotFoundResponse({ description: 'La publicación no existe' })
  eliminar(@Param('id', IdPipe) id: number, @UsuarioActual() usuario: UsuarioSesion) {
    return this.productos.eliminar(id, usuario.id);
  }
}
