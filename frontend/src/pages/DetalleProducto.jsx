import { Link, useParams } from 'react-router-dom';
import AgregarAlCarrito from '../components/AgregarAlCarrito';
import BotonFavorito from '../components/BotonFavorito';
import Cargando from '../components/Cargando';
import MensajeError from '../components/MensajeError';
import PreguntarVendedor from '../components/PreguntarVendedor';
import usePeticion from '../hooks/usePeticion';
import useSesion from '../hooks/useSesion';
import { urlImagen } from '../services/api';
import { obtenerProducto } from '../services/productos';
import { formatearPrecio, nombreCondicion } from '../utils/formato';

const AVISOS_ESTADO = {
  pausado: 'El vendedor pausó esta publicación: por ahora no se puede comprar.',
  agotado: 'Este producto está agotado.',
};

// Detalle de una publicación (HU-06) con los datos públicos del vendedor.
export default function DetalleProducto() {
  const { id } = useParams();
  const { usuario } = useSesion();
  const { datos: producto, cargando, error, recargar } = usePeticion(() => obtenerProducto(id), [id]);

  if (cargando) return <Cargando texto="Cargando producto…" />;
  if (error) {
    return (
      <section className="container py-5">
        <MensajeError error={error} alReintentar={[400, 404].includes(error.estado) ? undefined : recargar} />
        <p className="text-center"><Link to="/catalogo">Volver al catálogo</Link></p>
      </section>
    );
  }

  const esPropio = usuario?.id === producto.vendedor.id;
  const disponible = producto.estado === 'activo';

  return (
    <section className="container py-5">
      <nav aria-label="Ruta de navegación" className="mb-3 small">
        <ol className="breadcrumb mb-0">
          <li className="breadcrumb-item"><Link to="/catalogo">Catálogo</Link></li>
          <li className="breadcrumb-item">
            <Link to={`/catalogo?categoria=${producto.categoria.id}`}>{producto.categoria.nombre}</Link>
          </li>
          <li className="breadcrumb-item active text-truncate" aria-current="page">{producto.titulo}</li>
        </ol>
      </nav>

      <div className="row g-4">
        <div className="col-12 col-md-6">
          <img
            src={urlImagen(producto.imagen)}
            alt={producto.titulo}
            className="img-fluid rounded imagen-detalle w-100"
            onError={(evento) => {
              evento.currentTarget.src = '/sin-imagen.webp';
            }}
          />
        </div>

        <div className="col-12 col-md-6">
          <div className="d-flex flex-wrap gap-2 mb-2">
            <span className="badge text-bg-light etiqueta-categoria">{producto.categoria.nombre}</span>
            <span className="badge text-bg-secondary">{nombreCondicion(producto.condicion)}</span>
            {esPropio && <span className="badge text-bg-primary">Tu publicación</span>}
          </div>
          <h1 className="h3">{producto.titulo}</h1>
          <p className="precio fs-3 mb-2">{formatearPrecio(producto.precio)}</p>

          {!disponible && <div className="alert alert-warning py-2" role="status">{AVISOS_ESTADO[producto.estado]}</div>}

          <dl className="row small mb-3 ficha-producto">
            {producto.marca && (<><dt className="col-4">Marca</dt><dd className="col-8">{producto.marca}</dd></>)}
            {producto.modelo && (<><dt className="col-4">Modelo</dt><dd className="col-8">{producto.modelo}</dd></>)}
            <dt className="col-4">Disponibles</dt>
            <dd className="col-8">{producto.stock} {producto.stock === 1 ? 'unidad' : 'unidades'}</dd>
          </dl>

          <AgregarAlCarrito producto={producto} />
          <div className="d-flex flex-wrap gap-2 mb-3">
            <BotonFavorito producto={producto} conTexto />
          </div>
          {/* HU-13: preguntar al vendedor (no aparece en los productos propios) */}
          <PreguntarVendedor producto={producto} />

          {esPropio && (
            <div className="d-flex flex-wrap gap-2 mb-3">
              <Link to={`/productos/${producto.id}/editar`} className="btn btn-outline-primary">
                <i className="bi bi-pencil me-1" aria-hidden="true" />Editar publicación
              </Link>
              <Link to="/mis-publicaciones" className="btn btn-outline-secondary">Mis publicaciones</Link>
            </div>
          )}

          <h2 className="h6">Descripción</h2>
          <p className="descripcion-producto">{producto.descripcion}</p>

          <aside className="card mt-4" aria-label="Vendedor">
            <div className="card-body d-flex align-items-center gap-3">
              <div className="avatar avatar-chico" aria-hidden="true">{producto.vendedor.nombre.charAt(0)}</div>
              <div className="flex-grow-1">
                <p className="mb-0 fw-semibold">{producto.vendedor.nombre}</p>
                <p className="mb-0 small text-muted">{producto.vendedor.carrera ?? 'Carrera no indicada'}</p>
              </div>
              <Link to={`/usuarios/${producto.vendedor.id}`} className="btn btn-sm btn-outline-primary">Ver perfil</Link>
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}
