import { useContext } from 'react';
import { FavoritosContexto } from '../context/contextos';

// { esFavorito(id), alternar(id) → Promise<boolean> }. Sin sesión, nada es favorito.
export default function useFavoritos() {
  return useContext(FavoritosContexto);
}
