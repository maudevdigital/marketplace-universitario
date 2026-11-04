import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Request, Response } from 'express';
import { unlink } from 'node:fs/promises';

// Formato único de error para toda la API: { estado, mensaje }.
// Nunca devuelve trazas, consultas SQL ni detalles internos: esos van solo al registro del servidor.
@Catch()
export class FiltroErrores implements ExceptionFilter {
  private readonly registro = new Logger('Errores');

  catch(excepcion: unknown, host: ArgumentsHost) {
    const http = host.switchToHttp();
    const respuesta = http.getResponse<Response>();
    const { estado, mensaje } = this.traducir(excepcion);

    // Si la petición traía una imagen y falló (validación, permisos…), no dejarla huérfana.
    const archivo = http.getRequest<Request & { file?: Express.Multer.File }>().file;
    if (archivo?.path) void unlink(archivo.path).catch(() => undefined);

    respuesta.status(estado).json({ estado, mensaje });
  }

  private traducir(excepcion: unknown): { estado: number; mensaje: string } {
    if (excepcion instanceof HttpException) {
      const estado = excepcion.getStatus();
      if (estado === HttpStatus.PAYLOAD_TOO_LARGE) {
        return { estado, mensaje: 'La imagen supera el tamaño máximo de 2 MB.' };
      }
      return { estado, mensaje: this.mensajeDe(excepcion) };
    }

    if (excepcion instanceof Prisma.PrismaClientKnownRequestError) {
      switch (excepcion.code) {
        case 'P2002':
          return { estado: HttpStatus.CONFLICT, mensaje: 'Ya existe un registro con ese valor.' };
        case 'P2003':
          return { estado: HttpStatus.BAD_REQUEST, mensaje: 'El registro relacionado no existe.' };
        case 'P2025':
          return { estado: HttpStatus.NOT_FOUND, mensaje: 'El registro no existe.' };
      }
    }

    this.registro.error(excepcion instanceof Error ? excepcion.stack : String(excepcion));
    return {
      estado: HttpStatus.INTERNAL_SERVER_ERROR,
      mensaje: 'Ocurrió un error interno. Intenta de nuevo en unos minutos.',
    };
  }

  private mensajeDe(excepcion: HttpException): string {
    const cuerpo = excepcion.getResponse();
    if (typeof cuerpo === 'string') return cuerpo;
    const mensaje = (cuerpo as { message?: string | string[] }).message;
    if (Array.isArray(mensaje)) return mensaje.join(' ');
    return mensaje ?? excepcion.message;
  }
}
