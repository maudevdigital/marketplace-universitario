import { Route, Routes } from 'react-router-dom';
import Layout from './components/Layout';
import Catalogo from './pages/Catalogo';
import DetalleProducto from './pages/DetalleProducto';
import Ingreso from './pages/Ingreso';
import Inicio from './pages/Inicio';
import NoEncontrada from './pages/NoEncontrada';
import PerfilVendedor from './pages/PerfilVendedor';
import Registro from './pages/Registro';

// Mapa de navegación. Cada historia agrega su ruta aquí; las que necesitan sesión
// van envueltas en <RutaProtegida> (src/components/RutaProtegida.jsx). Ejemplo:
//   <Route path="carrito" element={<RutaProtegida><Carrito /></RutaProtegida>} />
//
// Rutas previstas: catalogo y productos/:id (HU-06) · publicar, mis-publicaciones y
// productos/:id/editar (HU-07) · favoritos (HU-09) · carrito (HU-10) · pedidos y
// ventas (HU-11) · pedidos/:id (HU-12) · mensajes y mensajes/:id (HU-13).
export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Inicio />} />
        <Route path="ingresar" element={<Ingreso />} />
        <Route path="registro" element={<Registro />} />
        <Route path="catalogo" element={<Catalogo />} />
        <Route path="productos/:id" element={<DetalleProducto />} />
        <Route path="usuarios/:id" element={<PerfilVendedor />} />
        <Route path="*" element={<NoEncontrada />} />
      </Route>
    </Routes>
  );
}
