import { Navigate, useLocation } from 'react-router-dom';
import useSesion from '../hooks/useSesion';
import Cargando from './Cargando';

// Envuelve las páginas que necesitan sesión (carrito, pedidos, publicar…).
// Sin sesión manda a /ingresar y recuerda a dónde quería ir, para volver después.
export default function RutaProtegida({ children }) {
  const { usuario, cargando } = useSesion();
  const ubicacion = useLocation();

  if (cargando) return <Cargando texto="Revisando tu sesión…" />;
  if (!usuario) return <Navigate to="/ingresar" replace state={{ desde: ubicacion.pathname }} />;
  return children;
}
