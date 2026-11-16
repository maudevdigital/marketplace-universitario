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

// Reglas que revisan el tipo del dato. Si el tipo está mal, las demás reglas de ese campo
// (mínimo, máximo, largo) también fallan y sus mensajes confunden: con un precio vacío se
// leía «no puede superar $100.000.000» junto a «debe ser mayor que cero». Se muestra solo el de tipo.
const REGLAS_DE_TIPO = ['isInt', 'isNumber', 'isString', 'isBoolean', 'isEnum', 'isEmail'];

function mensajes(errores: ValidationError[]): string[] {
  return errores.flatMap((error) => {
    const reglas = error.constraints ?? {};
    if (reglas.whitelistValidation) {
      return [`El campo «${error.property}» no está permitido.`];
    }
    const deTipo = REGLAS_DE_TIPO.filter((regla) => regla in reglas).map((regla) => reglas[regla]);
    const propios = deTipo.length > 0 ? deTipo : Object.values(reglas);
    return [...propios, ...mensajes(error.children ?? [])];
  });
}
