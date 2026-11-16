import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { PrismaService } from '../comun/prisma/prisma.service';

// Mercado Libre (sin clave). Documentación: https://developers.mercadolibre.cl/es_ar/categoriza-productos
//   GET /sites/MLC/domain_discovery/search?limit=1&q=…  → qué producto es, con marca y modelo
//   GET /categories/{id}                                  → ruta de la categoría (solo si hace falta)

interface PrediccionMercadoLibre {
  domain_id: string;
  domain_name: string;
  category_id: string;
  category_name: string;
  attributes?: { id: string; name: string; value_name: string | null }[];
}

interface CategoriaPrincipal {
  id: string;
  nombre: string;
}

export interface Sugerencia {
  titulo: string;
  encontrada: boolean;
  categoria: { id: number; nombre: string } | null;
  categoriaMercadoLibre: { dominio: string; nombre: string; principal: string | null } | null;
  marca: string | null;
  modelo: string | null;
}

const DURACION_MEMORIA = 60 * 60 * 1000; // una hora
const MAXIMO_EN_MEMORIA = 500;
const TIEMPO_MAXIMO = 4000; // milisegundos
const CATEGORIA_DE_RESPALDO = 'Otros';

// HU-08: sugerir categoría, marca y modelo a partir del título que escribe el vendedor.
//
// Se consulta desde el backend y no desde el navegador porque:
// 1. la categoría de Mercado Libre se traduce a las nuestras con la tabla equivalencias_categoria;
// 2. las respuestas quedan en memoria: el mismo título no se vuelve a consultar en una hora;
// 3. si Mercado Libre falla o tarda, respondemos un error controlado (503) y el formulario
//    se sigue llenando a mano. La publicación nunca depende de Mercado Libre.
//
// La categoría se traduce en dos niveles (ver prisma/equivalencias.js):
//   1. el tipo de producto exacto (MLC-HEADPHONES → Accesorios);
//   2. si no está, la categoría principal de Mercado Libre (MLC1574 «Hogar y Muebles» → Hogar y muebles).
// Si ninguno calza, se sugiere «Otros»: así cualquier producto reconocido recibe una categoría.
@Injectable()
export class SugerenciasService {
  private readonly registro = new Logger('Sugerencias');
  private readonly memoria = new Map<string, { guardadaEn: number; sugerencia: Sugerencia }>();

  constructor(private readonly prisma: PrismaService) {}

  async sugerir(titulo: string): Promise<Sugerencia> {
    const clave = titulo.trim().toLowerCase();
    const guardada = this.memoria.get(clave);
    if (guardada && Date.now() - guardada.guardadaEn < DURACION_MEMORIA) return guardada.sugerencia;

    const prediccion = await this.consultarPredictor(titulo);
    const sugerencia = prediccion ? await this.armarSugerencia(titulo, prediccion) : this.sinResultado(titulo);

    if (this.memoria.size >= MAXIMO_EN_MEMORIA) {
      // Se descarta la más antigua (un Map recuerda el orden en que se agregaron).
      this.memoria.delete(this.memoria.keys().next().value!);
    }
    this.memoria.set(clave, { guardadaEn: Date.now(), sugerencia });
    return sugerencia;
  }

  private async consultarPredictor(titulo: string): Promise<PrediccionMercadoLibre | null> {
    try {
      const lista = await this.pedirMercadoLibre<PrediccionMercadoLibre[]>(
        `/sites/MLC/domain_discovery/search?limit=1&q=${encodeURIComponent(titulo)}`,
      );
      return Array.isArray(lista) && lista.length > 0 ? lista[0] : null;
    } catch (error) {
      // El detalle va al registro del servidor; a la persona le llega un mensaje claro.
      this.registro.warn(`No se pudo consultar Mercado Libre: ${error instanceof Error ? error.message : error}`);
      throw new ServiceUnavailableException(
        'No pudimos consultar Mercado Libre en este momento. Completa los datos a mano.',
      );
    }
  }

  private async armarSugerencia(titulo: string, prediccion: PrediccionMercadoLibre): Promise<Sugerencia> {
    const { categoria, principal } = await this.traducirCategoria(prediccion);
    const marca = this.atributo(prediccion, 'BRAND', 'Marca');
    // Mercado Libre a veces repite la marca como modelo («Casio» / «Casio»): eso no aporta.
    const modeloCandidato =
      this.atributo(prediccion, 'ALPHANUMERIC_MODEL', 'Modelo alfanumérico') ?? this.atributo(prediccion, 'MODEL', 'Modelo');
    const modelo = modeloCandidato && modeloCandidato.toLowerCase() !== marca?.toLowerCase() ? modeloCandidato : null;

    return {
      titulo,
      encontrada: true,
      categoria,
      categoriaMercadoLibre: {
        dominio: prediccion.domain_id,
        nombre: prediccion.category_name,
        principal: principal?.nombre ?? null,
      },
      marca,
      modelo,
    };
  }

  private sinResultado(titulo: string): Sugerencia {
    return { titulo, encontrada: false, categoria: null, categoriaMercadoLibre: null, marca: null, modelo: null };
  }

  // Nivel 1: el tipo de producto exacto. Nivel 2: la categoría principal. Si no, «Otros».
  private async traducirCategoria(prediccion: PrediccionMercadoLibre) {
    let categoria = await this.categoriaEquivalente(prediccion.domain_id);
    let principal: CategoriaPrincipal | null = null;
    if (!categoria) {
      principal = await this.categoriaPrincipal(prediccion.category_id);
      categoria = principal ? await this.categoriaEquivalente(principal.id) : null;
    }
    categoria ??= await this.prisma.categoria.findUnique({
      where: { nombre: CATEGORIA_DE_RESPALDO },
      select: { id: true, nombre: true },
    });
    return { categoria, principal };
  }

  // Si esta consulta falla, no se pierde la sugerencia: se usa la categoría de respaldo.
  private async categoriaPrincipal(categoriaId: string): Promise<CategoriaPrincipal | null> {
    try {
      const categoria = await this.pedirMercadoLibre<{ path_from_root?: { id: string; name: string }[] }>(
        `/categories/${encodeURIComponent(categoriaId)}`,
      );
      const raiz = categoria.path_from_root?.[0];
      return raiz ? { id: raiz.id, nombre: raiz.name.trim() } : null;
    } catch (error) {
      this.registro.warn(`No se pudo leer la categoría ${categoriaId}: ${error instanceof Error ? error.message : error}`);
      return null;
    }
  }

  private async pedirMercadoLibre<T>(ruta: string): Promise<T> {
    const base = process.env.MERCADO_LIBRE_URL ?? 'https://api.mercadolibre.com';
    const respuesta = await fetch(`${base}${ruta}`, {
      headers: { 'User-Agent': 'marketplace-universitario' },
      signal: AbortSignal.timeout(TIEMPO_MAXIMO),
    });
    if (!respuesta.ok) throw new Error(`Mercado Libre respondió ${respuesta.status}`);
    return (await respuesta.json()) as T;
  }

  private async categoriaEquivalente(claveMercadoLibre: string) {
    const equivalencia = await this.prisma.equivalenciaCategoria.findUnique({
      where: { categoriaMercadoLibre: claveMercadoLibre },
      select: { categoria: { select: { id: true, nombre: true } } },
    });
    return equivalencia?.categoria ?? null;
  }

  private atributo(prediccion: PrediccionMercadoLibre, id: string, nombre: string): string | null {
    const encontrado = prediccion.attributes?.find((a) => a.id === id || a.name === nombre);
    const valor = encontrado?.value_name?.trim();
    return valor ? valor.slice(0, 60) : null; // 60: el largo máximo de marca y modelo en la base
  }
}
