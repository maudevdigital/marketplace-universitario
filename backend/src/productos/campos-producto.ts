import { Prisma } from '@prisma/client';

// Forma en que un producto sale de la API. Úsenla en el catálogo, favoritos, carrito, perfil…
// para que el frontend reciba siempre los mismos campos (y nunca datos privados del vendedor).
export const camposProductoPublico = {
  id: true,
  titulo: true,
  descripcion: true,
  marca: true,
  modelo: true,
  condicion: true,
  precio: true,
  stock: true,
  estado: true,
  imagen: true,
  creadoEn: true,
  categoria: { select: { id: true, nombre: true } },
  vendedor: { select: { id: true, nombre: true, carrera: true } },
} satisfies Prisma.ProductoSelect;
