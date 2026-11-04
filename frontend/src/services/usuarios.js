import { pedir } from './api';

export const obtenerPerfil = (id) => pedir(`/usuarios/${id}`);
