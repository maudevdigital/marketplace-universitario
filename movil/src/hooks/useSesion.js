import { useContext } from 'react';
import { SesionContext } from '../context/SesionContext';

/** @returns {{ usuario: object|null, cargando: boolean, ingresar: Function, salir: Function }} */
export default function useSesion() {
  return useContext(SesionContext);
}
