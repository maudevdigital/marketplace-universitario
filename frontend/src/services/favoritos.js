import { pedir } from './api';

// HU-09. Marcar y desmarcar se pueden repetir sin error.
export const listarFavoritos = () => pedir('/favoritos');

export const marcarFavorito = (productoId) => pedir(`/favoritos/${productoId}`, { metodo: 'POST' });

export const quitarFavorito = (productoId) => pedir(`/favoritos/${productoId}`, { metodo: 'DELETE' });
