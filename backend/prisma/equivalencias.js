// HU-08: equivalencias entre las categorías de Mercado Libre y las nuestras.
//
// La sugerencia busca en dos niveles (ver backend/src/sugerencias/sugerencias.service.ts):
//   1. POR TIPO DE PRODUCTO: el «dominio» exacto que devuelve el predictor (MLC-CALCULATORS).
//      Sirve para los casos finos: los audífonos son «Electrónica» en Mercado Libre, pero en
//      nuestro catálogo van en Accesorios, como en la Actividad 1.
//   2. POR CATEGORÍA PRINCIPAL: la primera de la ruta de Mercado Libre (MLC1574 = «Hogar y Muebles»).
//      Hay unas 25 y cubren cualquier producto.
// Si nada calza, se sugiere «Otros». Todos los identificadores se verificaron consultando a
// Mercado Libre el 04-11-2026 con productos típicos de estudiantes.

const POR_TIPO_DE_PRODUCTO = {
  Libros: ['MLC-BOOKS'],
  Tecnología: ['MLC-CALCULATORS', 'MLC-ELECTRONIC_DICTIONARIES'],
  Accesorios: [
    'MLC-HEADPHONES',
    'MLC-BACKPACKS',
    'MLC-TRAVEL_AND_TRAINING_BAGS',
    'MLC-WRISTWATCHES',
    'MLC-SUNGLASSES',
    'MLC-NOTEBOOKS_AND_WRITING_PADS',
  ],
  Instrumentos: ['MLC-ACOUSTIC_GUITARS', 'MLC-MUSICAL_KEYBOARDS', 'MLC-UKULELES', 'MLC-VIOLINS'],
  Deportes: ['MLC-SNEAKERS'],
};

const POR_CATEGORIA_PRINCIPAL = {
  Libros: [
    'MLC3025', // Libros, Revistas y Comics
  ],
  Tecnología: [
    'MLC1648', // Computación
    'MLC1051', // Celulares y Telefonía
    'MLC1000', // Electrónica, Audio y Video
    'MLC1144', // Consolas y Videojuegos
    'MLC1039', // Cámaras y Accesorios
  ],
  Accesorios: [
    'MLC3937', // Relojes y Joyas
    'MLC1368', // Arte, Librería y Cordonería (útiles)
    'MLC1246', // Belleza y Cuidado Personal
  ],
  Instrumentos: [
    'MLC1182', // Instrumentos Musicales
  ],
  Deportes: [
    'MLC1276', // Deportes y Fitness
  ],
  'Hogar y muebles': [
    'MLC1574', // Hogar y Muebles
    'MLC5726', // Electrodomésticos
    'MLC178483', // Herramientas
  ],
  'Ropa y calzado': [
    'MLC1430', // Vestuario y Calzado
  ],
};

// Inserta o actualiza cada equivalencia (se puede correr muchas veces sin duplicar).
async function cargarEquivalencias(prisma) {
  const categorias = await prisma.categoria.findMany();
  const idPorNombre = Object.fromEntries(categorias.map((c) => [c.nombre, c.id]));
  let total = 0;
  for (const tabla of [POR_TIPO_DE_PRODUCTO, POR_CATEGORIA_PRINCIPAL]) {
    for (const [nombre, claves] of Object.entries(tabla)) {
      for (const clave of claves) {
        await prisma.equivalenciaCategoria.upsert({
          where: { categoriaMercadoLibre: clave },
          update: { categoriaId: idPorNombre[nombre] },
          create: { categoriaMercadoLibre: clave, categoriaId: idPorNombre[nombre] },
        });
        total += 1;
      }
    }
  }
  // Equivalencias de una versión anterior que ya no están en las listas (por ejemplo, tipos de
  // producto que ahora se resuelven por su categoría principal).
  const vigentes = [...Object.values(POR_TIPO_DE_PRODUCTO), ...Object.values(POR_CATEGORIA_PRINCIPAL)].flat();
  await prisma.equivalenciaCategoria.deleteMany({ where: { categoriaMercadoLibre: { notIn: vigentes } } });
  return total;
}

module.exports = { cargarEquivalencias };
