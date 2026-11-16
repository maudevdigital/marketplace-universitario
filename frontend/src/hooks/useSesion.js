import { useContext } from 'react';
import { SesionContexto } from '../context/contextos';

// { usuario, cargando, ingresar, registrar, salir }. usuario es null si no hay sesión.
export default function useSesion() {
  return useContext(SesionContexto);
}
