import { BadRequestException, PipeTransform } from '@nestjs/common';
import { isValidObjectId } from 'mongoose';

// Los identificadores de MongoDB no son números sino textos de 24 caracteres
// (por ejemplo 6730a1f2c4e5b6a7d8e9f012). Este validador rechaza los mal escritos con 400
// antes de consultar la base. Uso: @Param('id', IdConversacionPipe) id: string
export class IdConversacionPipe implements PipeTransform<string, string> {
  transform(valor: string): string {
    if (!isValidObjectId(valor) || !/^[0-9a-f]{24}$/i.test(valor)) {
      throw new BadRequestException('El identificador de la conversación no es válido.');
    }
    return valor;
  }
}
