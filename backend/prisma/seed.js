// Datos iniciales: el mismo catálogo de la Actividad Evaluada 1, ahora guardado en PostgreSQL.
// Se puede correr muchas veces: categorías y usuarios se actualizan por su campo único,
// y los productos solo se cargan si la tabla está vacía (no pisa lo que publiquen los usuarios).
//
// Todos los usuarios de prueba entran con la contraseña de CLAVE_PRUEBA. Son datos ficticios.

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const { cargarEquivalencias } = require('./equivalencias');

const prisma = new PrismaClient();
const CLAVE_PRUEBA = 'Clave1234';

const categorias = [
  { nombre: 'Libros', icono: 'book' },
  { nombre: 'Tecnología', icono: 'laptop' },
  { nombre: 'Accesorios', icono: 'backpack' },
  { nombre: 'Instrumentos', icono: 'music-note-beamed' },
  { nombre: 'Deportes', icono: 'bicycle' },
  // HU-08: tres más para que todo lo que reconoce Mercado Libre tenga dónde quedar
  { nombre: 'Hogar y muebles', icono: 'house-heart' },
  { nombre: 'Ropa y calzado', icono: 'handbag' },
  { nombre: 'Otros', icono: 'three-dots' },
];

// Los vendedores de la Actividad 1, una cuenta que solo compra y las cuentas del equipo.
const usuarios = [
  { nombre: 'Camila Rojas', correo: 'camila.rojas@alumnos.cl', carrera: 'Ingeniería Civil' },
  { nombre: 'Carlos Mendoza', correo: 'carlos.mendoza@alumnos.cl', carrera: 'Ingeniería Física' },
  { nombre: 'Diego Fuentes', correo: 'diego.fuentes@alumnos.cl', carrera: 'Ingeniería Comercial' },
  { nombre: 'Fernanda Lagos', correo: 'fernanda.lagos@alumnos.cl', carrera: 'Enfermería' },
  { nombre: 'Ignacio Torres', correo: 'ignacio.torres@alumnos.cl', carrera: 'Ingeniería Eléctrica' },
  { nombre: 'Valentina Pérez', correo: 'valentina.perez@alumnos.cl', carrera: 'Diseño Gráfico' },
  { nombre: 'Matías Silva', correo: 'matias.silva@alumnos.cl', carrera: 'Pedagogía en Música' },
  { nombre: 'Javiera Núñez', correo: 'javiera.nunez@alumnos.cl', carrera: 'Fonoaudiología' },
  { nombre: 'Tomás Herrera', correo: 'tomas.herrera@alumnos.cl', carrera: 'Kinesiología' },
  { nombre: 'Estudiante Demo', correo: 'demo@alumnos.cl', carrera: 'Ingeniería en Computación' },
  // Las cuentas del Grupo 10, para probar y para la demostración: existen siempre, aunque se
  // reinicie la base. Correos ficticios (no son los reales de cada integrante).
  { nombre: 'Lucas Maulén', correo: 'lucas.maulen@alumnos.cl' },
  { nombre: 'Matías Catalán', correo: 'matias.catalan@alumnos.cl' },
  { nombre: 'Juan Soto', correo: 'juan.soto@alumnos.cl' },
];

const productos = [
  {
    titulo: 'Stewart - Calculus: Early Vectors', precio: 25000, stock: 2, categoria: 'Libros',
    vendedor: 'camila.rojas@alumnos.cl', imagen: 'libro1.webp', marca: 'Cengage', condicion: 'usado',
    descripcion: 'Libro de cálculo en buen estado, con anotaciones a lápiz en los primeros capítulos.',
  },
  {
    titulo: 'Solucionario University Physics, Volumen 1', precio: 32000, stock: 1, categoria: 'Libros',
    vendedor: 'carlos.mendoza@alumnos.cl', imagen: 'libro2.webp', marca: 'Pearson', condicion: 'usado',
    descripcion: 'Student Solutions Manual de Young y Freedman, capítulos 1 al 20. Tapa blanda, sin hojas sueltas.',
  },
  {
    titulo: 'Pocket Oxford Spanish Dictionary', precio: 15000, stock: 1, categoria: 'Libros',
    vendedor: 'diego.fuentes@alumnos.cl', imagen: 'libro3.webp', marca: 'Oxford', condicion: 'usado',
    descripcion: 'Diccionario de bolsillo usado, tapa algo gastada pero completo y legible.',
  },
  {
    titulo: 'Notebook Lenovo Flex 2', precio: 420000, stock: 1, categoria: 'Tecnología',
    vendedor: 'fernanda.lagos@alumnos.cl', imagen: 'notebook1.webp', marca: 'Lenovo', modelo: 'Flex 2', condicion: 'usado',
    descripcion: 'Pantalla táctil reclinable, Intel Core i5 con GeForce, 8 GB de RAM y 256 GB SSD. Incluye cargador.',
  },
  {
    titulo: 'Monitor LG Flatron Wide de 24 pulgadas', precio: 95000, stock: 1, categoria: 'Tecnología',
    vendedor: 'diego.fuentes@alumnos.cl', imagen: 'monitor1.webp', marca: 'LG', modelo: 'Flatron Wide', condicion: 'usado',
    descripcion: 'Monitor panorámico con base incluida, sin píxeles muertos. Ideal como segunda pantalla.',
  },
  {
    titulo: 'Calculadora Casio fx-991DE CW', precio: 28000, stock: 2, categoria: 'Tecnología',
    vendedor: 'ignacio.torres@alumnos.cl', imagen: 'calculadora1.webp', marca: 'Casio', modelo: 'fx-991DE CW', condicion: 'como_nuevo',
    descripcion: 'Científica ClassWiz de pantalla natural, permitida en pruebas. Incluye tapa original y manual.',
  },
  {
    titulo: 'Mochila Quechua para notebook 15 pulgadas', precio: 22000, stock: 4, categoria: 'Accesorios',
    vendedor: 'valentina.perez@alumnos.cl', imagen: 'mochila1.webp', marca: 'Quechua', condicion: 'usado',
    descripcion: 'Compartimento acolchado para notebook, cierres en buen estado. Usada un semestre.',
  },
  {
    titulo: 'Audífonos over-ear inalámbricos', precio: 39000, stock: 1, categoria: 'Accesorios',
    vendedor: 'camila.rojas@alumnos.cl', imagen: 'audifonos1.webp', condicion: 'como_nuevo',
    descripcion: 'Inalámbricos con cancelación pasiva, hasta 50 horas de batería. Incluye cable de carga.',
  },
  {
    titulo: 'Guitarra acústica Yamaha FG-331', precio: 145000, stock: 1, categoria: 'Instrumentos',
    vendedor: 'matias.silva@alumnos.cl', imagen: 'guitarra1.webp', marca: 'Yamaha', modelo: 'FG-331', condicion: 'usado',
    descripcion: 'Tapa de abeto, cuerdas nuevas y diapasón sin desgaste. Se entrega con funda blanda.',
  },
  {
    titulo: 'Teclado Casio CTK-7200', precio: 130000, stock: 1, categoria: 'Instrumentos',
    vendedor: 'javiera.nunez@alumnos.cl', imagen: 'teclado1.webp', marca: 'Casio', modelo: 'CTK-7200', condicion: 'usado',
    descripcion: '61 teclas sensibles al tacto, 820 tonos y secuenciador incorporado. Incluye transformador.',
  },
  {
    titulo: 'Bicicleta MTB Bulls Wild Cup', precio: 180000, stock: 3, categoria: 'Deportes',
    vendedor: 'tomas.herrera@alumnos.cl', imagen: 'bicicleta1.webp', marca: 'Bulls', modelo: 'Wild Cup', condicion: 'usado',
    descripcion: 'Marco de aluminio talla M, horquilla con suspensión, cambios Shimano y frenos de disco recién ajustados.',
  },
  {
    titulo: 'Set de mancuernas ajustables 20 kg', precio: 45000, stock: 1, categoria: 'Deportes',
    vendedor: 'fernanda.lagos@alumnos.cl', imagen: 'mancuernas1.webp', condicion: 'usado',
    descripcion: 'Par de barras con discos intercambiables y seguros de rosca. Sin óxido ni golpes.',
  },
];

async function main() {
  for (const categoria of categorias) {
    await prisma.categoria.upsert({
      where: { nombre: categoria.nombre },
      update: { icono: categoria.icono },
      create: categoria,
    });
  }

  const hashContrasena = await bcrypt.hash(CLAVE_PRUEBA, 10);
  for (const usuario of usuarios) {
    await prisma.usuario.upsert({
      where: { correo: usuario.correo },
      update: { nombre: usuario.nombre, carrera: usuario.carrera },
      create: { ...usuario, hashContrasena },
    });
  }

  // HU-08: categorías de Mercado Libre → categorías nuestras (ver prisma/equivalencias.js)
  const equivalencias = await cargarEquivalencias(prisma);
  console.log(`Datos iniciales: ${equivalencias} equivalencias de categorías de Mercado Libre.`);

  const productosExistentes = await prisma.producto.count();
  if (productosExistentes > 0) {
    console.log(`Datos iniciales: ya hay ${productosExistentes} productos, no se cargan de nuevo.`);
    return;
  }

  const idCategoria = Object.fromEntries(
    (await prisma.categoria.findMany()).map((c) => [c.nombre, c.id]),
  );
  const idUsuario = Object.fromEntries(
    (await prisma.usuario.findMany()).map((u) => [u.correo, u.id]),
  );

  for (const p of productos) {
    await prisma.producto.create({
      data: {
        titulo: p.titulo,
        descripcion: p.descripcion,
        precio: p.precio,
        stock: p.stock,
        marca: p.marca ?? null,
        modelo: p.modelo ?? null,
        condicion: p.condicion,
        imagen: `/imagenes/${p.imagen}`,
        categoriaId: idCategoria[p.categoria],
        vendedorId: idUsuario[p.vendedor],
      },
    });
  }
  console.log(`Datos iniciales: ${categorias.length} categorías, ${usuarios.length} usuarios y ${productos.length} productos.`);
}

main()
  .catch((error) => {
    console.error('No se pudieron cargar los datos iniciales:', error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
