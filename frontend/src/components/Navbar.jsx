import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import useAvisos from '../hooks/useAvisos';
import useMensajesNoLeidos from '../hooks/useMensajesNoLeidos';
import useSesion from '../hooks/useSesion';
import useTema from '../hooks/useTema';

// Barra superior. Cada historia agrega su enlace cuando su página exista:
//   ENLACES: para todos · ENLACES_CON_SESION: en la barra, solo con sesión (HU-13 agrega Mensajes)
//   MENU_USUARIO: dentro del menú con el nombre del usuario
const ENLACES = [
  { ruta: '/', texto: 'Inicio', icono: 'house' },
  { ruta: '/catalogo', texto: 'Catálogo', icono: 'grid' },
];
const ENLACES_CON_SESION = [
  { ruta: '/publicar', texto: 'Publicar', icono: 'plus-circle' },
  { ruta: '/favoritos', texto: 'Favoritos', icono: 'heart' },
  { ruta: '/carrito', texto: 'Carrito', icono: 'cart' },
  { ruta: '/mensajes', texto: 'Mensajes', icono: 'chat-dots' },
];
const MENU_USUARIO = [
  { ruta: '/mis-publicaciones', texto: 'Mis publicaciones', icono: 'shop-window' },
  { ruta: '/pedidos', texto: 'Mis pedidos', icono: 'bag-check' },
  { ruta: '/ventas', texto: 'Mis ventas', icono: 'cash-coin' },
];

export default function Navbar() {
  const { usuario, salir } = useSesion();
  const { tema, alternar } = useTema();
  const { mostrarAviso } = useAvisos();
  const navegar = useNavigate();
  const [abierto, setAbierto] = useState(false);
  const noLeidos = useMensajesNoLeidos(usuario);

  const cerrarSesion = () => {
    salir();
    mostrarAviso('Cerraste sesión.', 'info');
    navegar('/');
  };

  const enlaces = usuario ? [...ENLACES, ...ENLACES_CON_SESION] : ENLACES;

  return (
    <header>
      <nav className="navbar navbar-expand-lg border-bottom sticky-top" aria-label="Navegación principal">
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
                  <NavLink className="nav-link" to={enlace.ruta} end={enlace.ruta !== '/mensajes'} onClick={() => setAbierto(false)}>
                    <i className={`bi bi-${enlace.icono} me-1`} aria-hidden="true" />
                    {enlace.texto}
                    {/* HU-13: mensajes sin leer */}
                    {enlace.ruta === '/mensajes' && noLeidos > 0 && (
                      <span className="badge rounded-pill text-bg-danger ms-1">
                        {noLeidos}
                        <span className="visually-hidden"> sin leer</span>
                      </span>
                    )}
                  </NavLink>
                </li>
              ))}
            </ul>

            <div className="d-flex flex-wrap align-items-center gap-2 py-2 py-lg-0">
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
                <MenuUsuario usuario={usuario} alSalir={cerrarSesion} alNavegar={() => setAbierto(false)} />
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

// Menú desplegable con el nombre del usuario. Se cierra al elegir, al hacer clic afuera o con Escape.
function MenuUsuario({ usuario, alSalir, alNavegar }) {
  const [abierto, setAbierto] = useState(false);
  const contenedor = useRef(null);

  useEffect(() => {
    if (!abierto) return undefined;
    const alClicAfuera = (evento) => {
      if (!contenedor.current?.contains(evento.target)) setAbierto(false);
    };
    const alTeclear = (evento) => evento.key === 'Escape' && setAbierto(false);
    document.addEventListener('mousedown', alClicAfuera);
    document.addEventListener('keydown', alTeclear);
    return () => {
      document.removeEventListener('mousedown', alClicAfuera);
      document.removeEventListener('keydown', alTeclear);
    };
  }, [abierto]);

  const elegir = () => {
    setAbierto(false);
    alNavegar();
  };

  return (
    <div className="dropdown" ref={contenedor}>
      <button
        type="button"
        className="btn btn-sm btn-outline-primary dropdown-toggle texto-usuario-menu"
        aria-expanded={abierto}
        aria-haspopup="true"
        onClick={() => setAbierto((valor) => !valor)}
      >
        <i className="bi bi-person-circle me-1" aria-hidden="true" />
        {usuario.nombre}
      </button>
      <ul className={`dropdown-menu dropdown-menu-end ${abierto ? 'show' : ''}`}>
        <li>
          <Link className="dropdown-item" to={`/usuarios/${usuario.id}`} onClick={elegir}>
            <i className="bi bi-person me-2" aria-hidden="true" />Mi perfil público
          </Link>
        </li>
        {MENU_USUARIO.map((enlace) => (
          <li key={enlace.ruta}>
            <NavLink className="dropdown-item" to={enlace.ruta} end onClick={elegir}>
              <i className={`bi bi-${enlace.icono} me-2`} aria-hidden="true" />{enlace.texto}
            </NavLink>
          </li>
        ))}
        <li><hr className="dropdown-divider" /></li>
        <li>
          <button type="button" className="dropdown-item" onClick={() => { elegir(); alSalir(); }}>
            <i className="bi bi-box-arrow-right me-2" aria-hidden="true" />Salir
          </button>
        </li>
      </ul>
    </div>
  );
}
