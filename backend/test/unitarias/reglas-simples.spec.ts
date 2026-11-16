// HU-14: reglas que no necesitan base de datos.
import { problemaDelItem } from '../../src/carrito/carrito.service';
import { numeroOpcional } from '../../src/comun/transformaciones';
import { crearTuberiaValidacion } from '../../src/comun/validacion';
import { CrearProductoDto } from '../../src/productos/dto/producto.dto';
import { FiltrosCatalogoDto } from '../../src/productos/dto/catalogo.dto';

describe('Carrito: por qué un producto no se puede comprar', () => {
  it('avisa si el vendedor lo pausó', () => {
    expect(problemaDelItem({ estado: 'pausado', stock: 3 }, 1)).toBe('El vendedor pausó esta publicación.');
  });

  it('avisa si se agotó', () => {
    expect(problemaDelItem({ estado: 'agotado', stock: 0 }, 1)).toBe('Este producto se agotó.');
  });

  it('usa singular y plural correctos cuando no alcanza el stock', () => {
    expect(problemaDelItem({ estado: 'activo', stock: 1 }, 2)).toBe('Solo queda 1 unidad.');
    expect(problemaDelItem({ estado: 'activo', stock: 3 }, 5)).toBe('Solo quedan 3 unidades.');
  });

  it('no avisa nada si se puede comprar', () => {
    expect(problemaDelItem({ estado: 'activo', stock: 2 }, 2)).toBeNull();
  });
});

describe('Números que llegan como texto', () => {
  const convertir = (valor: unknown) => numeroOpcional({ obj: { campo: valor }, key: 'campo' });

  it('el texto vacío o con espacios cuenta como «no enviado»', () => {
    expect(convertir('')).toBeUndefined();
    expect(convertir('   ')).toBeUndefined();
    expect(convertir(undefined)).toBeUndefined();
  });

  it('convierte los números escritos como texto', () => {
    expect(convertir('25000')).toBe(25000);
    expect(convertir(' 7 ')).toBe(7);
    expect(convertir(3)).toBe(3);
  });

  it('lo que no es número queda como NaN para que la validación lo rechace', () => {
    expect(convertir('abc')).toBeNaN();
  });
});

describe('Validación de datos (mensajes que ve la persona)', () => {
  const tuberia = crearTuberiaValidacion();
  const validar = (datos: object, tipo: unknown) =>
    tuberia.transform(datos, { type: 'body', metatype: tipo as never });

  const productoValido = {
    titulo: 'Calculadora Casio fx-570',
    descripcion: 'Científica, permitida en pruebas. Incluye tapa.',
    categoriaId: '2',
    precio: '18000',
    stock: '1',
  };

  it('convierte los números de un formulario con imagen', async () => {
    const producto = await validar(productoValido, CrearProductoDto);
    expect(producto).toMatchObject({ categoriaId: 2, precio: 18000, stock: 1 });
  });

  it('con un precio vacío muestra un solo mensaje, no tres contradictorios', async () => {
    await expect(validar({ ...productoValido, precio: '' }, CrearProductoDto)).rejects.toMatchObject({
      response: { message: ['El precio debe ser un número entero.'] },
    });
  });

  it('rechaza campos que no existen', async () => {
    await expect(validar({ ...productoValido, vendedorId: 1 }, CrearProductoDto)).rejects.toMatchObject({
      response: { message: ['El campo «vendedorId» no está permitido.'] },
    });
  });

  it('el catálogo ignora los filtros vacíos', async () => {
    const filtros = await validar({ categoria: '', q: '', pagina: '' }, FiltrosCatalogoDto);
    expect(filtros).toMatchObject({ categoria: undefined, q: undefined, pagina: undefined });
  });
});
