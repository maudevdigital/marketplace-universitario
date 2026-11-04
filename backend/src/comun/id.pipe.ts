import { BadRequestException, ParseIntPipe } from '@nestjs/common';

// Igual que ParseIntPipe, pero con el mensaje en español.
// Uso: @Param('id', IdPipe) id: number
export const IdPipe = new ParseIntPipe({
  exceptionFactory: () => new BadRequestException('El identificador debe ser un número entero.'),
});
