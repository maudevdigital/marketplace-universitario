import { useParams } from 'react-router-dom';
import Cargando from '../components/Cargando';
import EstadoVacio from '../components/EstadoVacio';
import MensajeError from '../components/MensajeError';
import TarjetaProducto from '../components/TarjetaProducto';
import usePeticion from '../hooks/usePeticion';
import useSesion from '../hooks/useSesion';
import { obtenerPerfil } from '../services/usuarios';
import { formatearFecha } from '../utils/formato';

// Perfil público de un vendedor con sus publicaciones activas (HU-03).
export default function PerfilVendedor() {
  const { id } = useParams();
  const { usuario } = useSesion();
  const { datos: perfil, cargando, error, recargar } = usePeticion(() => obtenerPerfil(id), [id]);

  if (cargando) return <Cargando texto="Cargando perfil…" />;
  if (error) return <MensajeError error={error} alReintentar={error.estado === 404 ? undefined : recargar} />;

  const esMiPerfil = usuario?.id === perfil.id;

  return (
    <section className="container py-5">
      <header className="d-flex align-items-center gap-3 mb-4">
        <div className="avatar" aria-hidden="true">{perfil.nombre.charAt(0)}</div>
        <div>
          <h1 className="h3 mb-0">{perfil.nombre}{esMiPerfil && <span className="badge text-bg-primary ms-2 align-middle fs-6">Tú</span>}</h1>
          <p className="text-muted mb-0">
            {perfil.carrera ?? 'Carrera no indicada'} · En UniMarket desde el {formatearFecha(perfil.creadoEn)}
          </p>
        </div>
      </header>

      <h2 className="h5 mb-3">Publicaciones activas ({perfil.publicaciones.length})</h2>
      {perfil.publicaciones.length === 0 ? (
        <EstadoVacio
          icono="bag"
          titulo={esMiPerfil ? 'Todavía no publicas nada' : 'Sin publicaciones activas'}
          texto={esMiPerfil ? 'Cuando publiques un producto, aparecerá aquí.' : 'Vuelve más tarde.'}
        />
      ) : (
        <ul className="row g-3 list-unstyled">
          {perfil.publicaciones.map((producto) => (
            <li key={producto.id} className="col-12 col-sm-6 col-lg-4 col-xl-3">
              <TarjetaProducto producto={producto} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
