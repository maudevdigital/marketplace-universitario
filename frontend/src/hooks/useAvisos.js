import { useContext } from 'react';
import { AvisosContexto } from '../context/contextos';

// { mostrarAviso(texto, tipo) } con tipo 'exito', 'error' o 'info'.
export default function useAvisos() {
  return useContext(AvisosContexto);
}
