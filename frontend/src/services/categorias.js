import { pedir } from './api';

export const listarCategorias = () => pedir('/categorias');
