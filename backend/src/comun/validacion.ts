import { BadRequestException, ValidationError, ValidationPipe } from '@nestjs/common';

// Validación global de todos los cuerpos y parámetros de consulta:
// - whitelist: descarta campos que el esquema no declara;
// - forbidNonWhitelisted: y además avisa, para que el error no pase desapercibido;
// - transform: convierte "25000" en 25000 cuando el esquema dice número (formularios con imagen).
export function crearTuberiaValidacion() {
  return new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
    // Sin repetir: «abc» como categoría rompe dos reglas que dicen lo mismo.
    exceptionFactory: (errores) => new BadRequestException([...new Set(mensajes(errores))]),
  });
}

function mensajes(errores: ValidationError[]): string[] {
  return errores.flatMap((error) => {
    if (error.constraints?.whitelistValidation) {
      return [`El campo «${error.property}» no está permitido.`];
    }
    const propios = Object.values(error.constraints ?? {});
    return [...propios, ...mensajes(error.children ?? [])];
  });
}
