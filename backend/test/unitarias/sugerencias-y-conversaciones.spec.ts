// HU-14: sugerencias de Mercado Libre (HU-08) y reglas de las conversaciones (HU-13).
import {
  ForbiddenException,
  NotFoundException,
  ServiceUnavailableException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { ConversacionesService } from '../../src/conversaciones/conversaciones.service';
import { SugerenciasService } from '../../src/sugerencias/sugerencias.service';

describe('Sugerencias de Mercado Libre', () => {
  const audifonos = {
    domain_id: 'MLC-HEADPHONES',
    domain_name: 'Audífonos',
    category_id: 'MLC3697',
    category_name: 'Audífonos',
    attributes: [
      { id: 'BRAND', name: 'Marca', value_name: 'Sony' },
      { id: 'MODEL', name: 'Modelo', value_name: 'WH-CH720N' },
    ],
  };
  const escritorio = {
    domain_id: 'MLC-HOME_OFFICE_DESKS',
    domain_name: 'Escritorios',
    category_id: 'MLC174439',
    category_name: 'Escritorios',
    attributes: [],
  };
  const rutaEscritorio = { path_from_root: [{ id: 'MLC1574', name: 'Hogar y Muebles' }, { id: 'MLC174439', name: 'Escritorios' }] };

  // equivalencias: clave de Mercado Libre → categoría nuestra
  function crearServicio(equivalencias: Record<string, { id: number; nombre: string }> = {}) {
    const prisma = {
      equivalenciaCategoria: {
        findUnique: jest.fn(({ where }) => {
          const categoria = equivalencias[where.categoriaMercadoLibre];
          return Promise.resolve(categoria ? { categoria } : null);
        }),
      },
      categoria: { findUnique: jest.fn().mockResolvedValue({ id: 8, nombre: 'Otros' }) },
    };
    return new SugerenciasService(prisma as never);
  }

  // Simula a Mercado Libre: el predictor y la ruta de la categoría responden por separado.
  function simularMercadoLibre(prediccion: unknown, ruta: unknown = rutaEscritorio, { predictorOk = true, rutaOk = true } = {}) {
    return jest.spyOn(globalThis, 'fetch').mockImplementation(async (direccion) => {
      const [ok, cuerpo] = String(direccion).includes('domain_discovery') ? [predictorOk, prediccion] : [rutaOk, ruta];
      return { ok, status: ok ? 200 : 500, json: async () => cuerpo } as Response;
    });
  }
  const llamadasA = (consulta: jest.SpyInstance, parte: string) =>
    consulta.mock.calls.filter(([direccion]) => String(direccion).includes(parte)).length;

  afterEach(() => jest.restoreAllMocks());

  it('nivel 1: traduce por tipo de producto y trae marca y modelo', async () => {
    const consulta = simularMercadoLibre([audifonos]);
    const servicio = crearServicio({ 'MLC-HEADPHONES': { id: 3, nombre: 'Accesorios' } });
    await expect(servicio.sugerir('audifonos sony')).resolves.toMatchObject({
      encontrada: true,
      categoria: { id: 3, nombre: 'Accesorios' },
      marca: 'Sony',
      modelo: 'WH-CH720N',
    });
    expect(llamadasA(consulta, '/categories/')).toBe(0); // no hizo falta pedir la categoría principal
  });

  it('nivel 2: si el tipo no está, usa la categoría principal (un escritorio va a Hogar y muebles)', async () => {
    simularMercadoLibre([escritorio]);
    const servicio = crearServicio({ MLC1574: { id: 6, nombre: 'Hogar y muebles' } });
    await expect(servicio.sugerir('escritorio')).resolves.toMatchObject({
      categoria: { id: 6, nombre: 'Hogar y muebles' },
      categoriaMercadoLibre: { nombre: 'Escritorios', principal: 'Hogar y Muebles' },
    });
  });

  it('si nada calza, sugiere «Otros» en vez de dejar la categoría vacía', async () => {
    simularMercadoLibre([escritorio]);
    await expect(crearServicio().sugerir('escritorio')).resolves.toMatchObject({ categoria: { nombre: 'Otros' } });
  });

  it('si falla la consulta de la categoría principal, igual sugiere («Otros»)', async () => {
    simularMercadoLibre([escritorio], null, { rutaOk: false });
    await expect(crearServicio().sugerir('escritorio')).resolves.toMatchObject({ encontrada: true, categoria: { nombre: 'Otros' } });
  });

  it('descarta el modelo cuando Mercado Libre repite la marca', async () => {
    simularMercadoLibre([{ ...audifonos, attributes: [
      { id: 'BRAND', name: 'Marca', value_name: 'Casio' },
      { id: 'MODEL', name: 'Modelo', value_name: 'Casio' },
    ] }]);
    await expect(crearServicio().sugerir('calculadora casio')).resolves.toMatchObject({ marca: 'Casio', modelo: null });
  });

  it('el mismo título no se vuelve a consultar (queda en memoria)', async () => {
    const consulta = simularMercadoLibre([audifonos]);
    const servicio = crearServicio({ 'MLC-HEADPHONES': { id: 3, nombre: 'Accesorios' } });
    await servicio.sugerir('Audifonos Sony');
    await servicio.sugerir('audifonos sony ');
    expect(llamadasA(consulta, 'domain_discovery')).toBe(1);
  });

  it('si el predictor de Mercado Libre falla, responde 503 con un mensaje claro', async () => {
    simularMercadoLibre(null, null, { predictorOk: false });
    await expect(crearServicio().sugerir('audifonos sony')).rejects.toBeInstanceOf(ServiceUnavailableException);
  });

  it('si no reconoce el título, lo dice sin error', async () => {
    simularMercadoLibre([]);
    await expect(crearServicio().sugerir('xqzw')).resolves.toMatchObject({ encontrada: false, categoria: null });
  });
});

describe('Conversaciones', () => {
  function crearServicio(producto: object | null, conversacion: object | null = null) {
    const prisma = { producto: { findUnique: jest.fn().mockResolvedValue(producto) } };
    const modelo = {
      findOneAndUpdate: jest.fn(),
      findById: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue(conversacion) }),
    };
    return { servicio: new ConversacionesService(modelo as never, prisma as never), modelo };
  }

  it('nadie se pregunta a sí mismo por su propio producto', async () => {
    const { servicio, modelo } = crearServicio({ id: 9, titulo: 'Guitarra', vendedorId: 7, estado: 'activo' });
    await expect(servicio.iniciar(7, 9, 'hola')).rejects.toBeInstanceOf(UnprocessableEntityException);
    expect(modelo.findOneAndUpdate).not.toHaveBeenCalled();
  });

  it('no se pregunta por una publicación eliminada', async () => {
    const { servicio } = crearServicio({ id: 9, titulo: 'Guitarra', vendedorId: 7, estado: 'eliminado' });
    await expect(servicio.iniciar(10, 9, 'hola')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('una tercera persona no puede leer la conversación', async () => {
    const { servicio } = crearServicio(null, { _id: 'x', compradorId: 10, vendedorId: 7, mensajes: [] });
    await expect(servicio.detalle('6730a1f2c4e5b6a7d8e9f012', 3)).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('una conversación que no existe responde 404', async () => {
    const { servicio } = crearServicio(null, null);
    await expect(servicio.responder('6730a1f2c4e5b6a7d8e9f012', 10, 'hola')).rejects.toBeInstanceOf(NotFoundException);
  });
});
