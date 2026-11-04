import { Outlet } from 'react-router-dom';
import Footer from './Footer';
import Navbar from './Navbar';

// Estructura común: barra superior, contenido de la página actual y pie.
export default function Layout() {
  return (
    <div className="d-flex flex-column min-vh-100">
      <Navbar />
      <main className="flex-grow-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
