import { Route, Routes } from 'react-router-dom';
import Layout from './components/Layout';
import RutaProtegida from './components/RutaProtegida';
import Carrito from './pages/Carrito';
import Catalogo from './pages/Catalogo';
import DetallePedido from './pages/DetallePedido';
import DetalleProducto from './pages/DetalleProducto';
import EditarProducto from './pages/EditarProducto';
import Favoritos from './pages/Favoritos';
import Ingreso from './pages/Ingreso';
import Inicio from './pages/Inicio';
import ListaPedidos from './pages/ListaPedidos';
import MisPublicaciones from './pages/MisPublicaciones';
import NoEncontrada from './pages/NoEncontrada';
import PerfilVendedor from './pages/PerfilVendedor';
import Publicar from './pages/Publicar';
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
        <Route path="publicar" element={<RutaProtegida><Publicar /></RutaProtegida>} />
        <Route path="mis-publicaciones" element={<RutaProtegida><MisPublicaciones /></RutaProtegida>} />
        <Route path="favoritos" element={<RutaProtegida><Favoritos /></RutaProtegida>} />
        <Route path="carrito" element={<RutaProtegida><Carrito /></RutaProtegida>} />
        <Route path="pedidos" element={<RutaProtegida><ListaPedidos key="comprador" rol="comprador" /></RutaProtegida>} />
        <Route path="ventas" element={<RutaProtegida><ListaPedidos key="vendedor" rol="vendedor" /></RutaProtegida>} />
        <Route path="pedidos/:id" element={<RutaProtegida><DetallePedido /></RutaProtegida>} />
        <Route path="productos/:id/editar" element={<RutaProtegida><EditarProducto /></RutaProtegida>} />
        <Route path="usuarios/:id" element={<PerfilVendedor />} />
        <Route path="*" element={<NoEncontrada />} />
      </Route>
    </Routes>
  );
}
