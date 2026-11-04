import { Link, NavLink, useNavigate } from 'react-router-dom';
import useSesion from '../hooks/useSesion';
import useTema from '../hooks/useTema';
import useAvisos from '../hooks/useAvisos';
import { useState } from 'react';

// Barra superior. Cada historia agrega su enlace en ENLACES cuando su página exista:
//   HU-06 Catálogo · HU-07 Publicar y Mis publicaciones · HU-09 Favoritos
//   HU-10 Carrito · HU-11 Mis pedidos y Mis ventas · HU-13 Mensajes
const ENLACES = [
  { ruta: '/', texto: 'Inicio', icono: 'house' },
  { ruta: '/catalogo', texto: 'Catálogo', icono: 'grid' },
];
const ENLACES_CON_SESION = [];

export default function Navbar() {
  const { usuario, salir } = useSesion();
  const { tema, alternar } = useTema();
  const { mostrarAviso } = useAvisos();
  const navegar = useNavigate();
  const [abierto, setAbierto] = useState(false);

  const cerrarSesion = () => {
    salir();
    mostrarAviso('Cerraste sesión.', 'info');
    navegar('/');
  };

  const enlaces = usuario ? [...ENLACES, ...ENLACES_CON_SESION] : ENLACES;

  return (
    <header>
      <nav className="navbar navbar-expand-md border-bottom sticky-top" aria-label="Navegación principal">
        <div className="container">
          <Link className="navbar-brand fw-bold" to="/">
            <i className="bi bi-shop me-2" aria-hidden="true" />
            UniMarket
          </Link>
          <button
            className="navbar-toggler"
            type="button"
            aria-controls="menu-principal"
            aria-expanded={abierto}
            aria-label="Abrir menú"
            onClick={() => setAbierto((valor) => !valor)}
          >
            <span className="navbar-toggler-icon" />
          </button>

          <div id="menu-principal" className={`collapse navbar-collapse ${abierto ? 'show' : ''}`}>
            <ul className="navbar-nav me-auto">
              {enlaces.map((enlace) => (
                <li className="nav-item" key={enlace.ruta}>
                  <NavLink className="nav-link" to={enlace.ruta} end onClick={() => setAbierto(false)}>
                    <i className={`bi bi-${enlace.icono} me-1`} aria-hidden="true" />
                    {enlace.texto}
                  </NavLink>
                </li>
              ))}
            </ul>

            <div className="d-flex align-items-center gap-2">
              <button
                type="button"
                className="btn btn-sm btn-outline-secondary"
                onClick={alternar}
                aria-label={tema === 'oscuro' ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro'}
                title="Cambiar tema"
              >
                <i className={`bi ${tema === 'oscuro' ? 'bi-sun' : 'bi-moon-stars'}`} aria-hidden="true" />
              </button>

              {usuario ? (
                <>
                  <Link to={`/usuarios/${usuario.id}`} className="small text-decoration-none texto-usuario">
                    <i className="bi bi-person-circle me-1" aria-hidden="true" />
                    {usuario.nombre}
                  </Link>
                  <button type="button" className="btn btn-sm btn-outline-primary" onClick={cerrarSesion}>
                    Salir
                  </button>
                </>
              ) : (
                <>
                  <Link to="/ingresar" className="btn btn-sm btn-outline-primary">Ingresar</Link>
                  <Link to="/registro" className="btn btn-sm btn-primary">Crear cuenta</Link>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>
    </header>
  );
}
