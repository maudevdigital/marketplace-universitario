import { createContext } from 'react';

// Los contextos van en un archivo aparte de sus proveedores para que Vite pueda
// recargar los componentes en caliente (regla react-refresh del lint).
export const SesionContexto = createContext(null);
export const AvisosContexto = createContext(null);
