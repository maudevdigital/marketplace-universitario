import { BadRequestException } from '@nestjs/common';
import { MulterOptions } from '@nestjs/platform-express/multer/interfaces/multer-options.interface';
import { randomUUID } from 'node:crypto';
import { unlink } from 'node:fs/promises';
import { extname, join, resolve } from 'node:path';
import { diskStorage } from 'multer';

const TIPOS_PERMITIDOS = ['image/jpeg', 'image/png', 'image/webp'];
const TAMANO_MAXIMO = 2 * 1024 * 1024; // 2 MB

// Carpeta donde quedan las imágenes subidas (en Docker es un volumen).
export const carpetaImagenes = () => resolve(process.env.IMAGENES_DIR ?? './almacen/imagenes');

// Configuración de subida para FileInterceptor('imagen', opcionesImagen).
export const opcionesImagen: MulterOptions = {
  storage: diskStorage({
    destination: (_peticion, _archivo, listo) => listo(null, carpetaImagenes()),
    // Nombre aleatorio: evita choques y que alguien pise la imagen de otro.
    filename: (_peticion, archivo, listo) =>
      listo(null, `${randomUUID()}${extname(archivo.originalname).toLowerCase()}`),
  }),
  limits: { fileSize: TAMANO_MAXIMO, files: 1 },
  fileFilter: (_peticion, archivo, listo) => {
    if (TIPOS_PERMITIDOS.includes(archivo.mimetype)) return listo(null, true);
    listo(new BadRequestException('La imagen debe ser JPG, PNG o WEBP.'), false);
  },
};

export const rutaPublica = (archivo: Express.Multer.File) => `/imagenes/${archivo.filename}`;

// Borra una imagen subida por un usuario. Las del catálogo inicial no se tocan
// porque no están en la carpeta de subidas.
export async function borrarImagenSubida(rutaImagen: string | null | undefined) {
  if (!rutaImagen?.startsWith('/imagenes/')) return;
  const nombre = rutaImagen.replace('/imagenes/', '');
  if (nombre.includes('/') || nombre.includes('..')) return;
  await unlink(join(carpetaImagenes(), nombre)).catch(() => undefined);
}
