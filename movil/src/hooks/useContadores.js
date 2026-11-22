import { useContext } from 'react';
import { ContadoresContext } from '../context/ContadoresContext';

/** @returns {{ unidadesCarrito: number, noLeidos: number, actualizar: () => Promise<void> }} */
export default function useContadores() {
  return useContext(ContadoresContext);
}
