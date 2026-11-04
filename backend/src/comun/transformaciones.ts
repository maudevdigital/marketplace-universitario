// Conversión de números que llegan como texto: filtros en la dirección (?categoria=2)
// y formularios con imagen (multipart). Uso: @Transform(numeroOpcional)
//
// Por qué no basta con @Type(() => Number): class-transformer convierte el tipo ANTES de
// aplicar @Transform, y Number('') es 0. Así, «?categoria=» llegaba como categoría 0
// («no válida») y un stock enviado vacío al editar dejaba la publicación agotada.
// Aquí se lee el valor original (obj[key]) y el texto vacío se trata como «no enviado».
export const numeroOpcional = ({ obj, key }: { obj: Record<string, unknown>; key: string }) => {
  const original = obj[key];
  if (original === undefined || original === null) return undefined;
  if (typeof original === 'number') return original;
  const texto = String(original).trim();
  // Lo que no es número queda como NaN y lo rechaza @IsInt con su mensaje en español.
  return texto === '' ? undefined : Number(texto);
};
