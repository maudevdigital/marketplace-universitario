import { pedir } from './api';

// HU-08: el backend consulta a Mercado Libre y devuelve { encontrada, categoria, marca, modelo, … }.
export const sugerirProducto = (titulo) =>
  pedir(`/sugerencias/producto?titulo=${encodeURIComponent(titulo.trim())}`);
