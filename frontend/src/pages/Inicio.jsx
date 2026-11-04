import { Link } from 'react-router-dom';
import Cargando from '../components/Cargando';
import EstadoVacio from '../components/EstadoVacio';
import MensajeError from '../components/MensajeError';
import usePeticion from '../hooks/usePeticion';
import useSesion from '../hooks/useSesion';
import { listarCategorias } from '../services/categorias';

// Portada. Las categorías vienen del backend y muestran los cuatro estados de una pantalla:
// cargando, error (con reintento), vacío y con datos. Sirve de ejemplo para el resto de las páginas.
export default function Inicio() {
  const { usuario } = useSesion();
  const { datos: categorias, cargando, error, recargar } = usePeticion(listarCategorias);

  return (
    <>
      <section className="portada py-5">
        <div className="container">
          <h1 className="display-6 fw-bold">Compra y vende entre estudiantes</h1>
          <p className="lead mb-4">
            Libros, tecnología, instrumentos y más, publicados por la comunidad universitaria.
          </p>
          {!usuario && (
            <div className="d-flex flex-wrap gap-2">
              <Link to="/registro" className="btn btn-light btn-lg">Crear cuenta</Link>
              <Link to="/ingresar" className="btn btn-outline-light btn-lg">Ya tengo cuenta</Link>
            </div>
          )}
        </div>
      </section>

      <section className="container py-5" aria-labelledby="titulo-categorias">
        <h2 id="titulo-categorias" className="h4 mb-4">Categorías</h2>
        <ListaCategorias categorias={categorias} cargando={cargando} error={error} recargar={recargar} />
      </section>
    </>
  );
}

function ListaCategorias({ categorias, cargando, error, recargar }) {
  if (cargando) return <Cargando texto="Cargando categorías…" />;
  if (error) return <MensajeError error={error} alReintentar={recargar} />;
  if (categorias.length === 0) {
    return <EstadoVacio icono="tags" titulo="Aún no hay categorías" texto="Carga los datos iniciales del backend." />;
  }

  return (
    <ul className="row g-3 list-unstyled">
      {categorias.map((categoria) => (
        <li key={categoria.id} className="col-6 col-md-4 col-lg">
          {/* HU-06 (catálogo) recibe la categoría elegida por la dirección: /catalogo?categoria=2 */}
          <Link to={`/catalogo?categoria=${categoria.id}`} className="card tarjeta-categoria h-100 text-decoration-none">
            <div className="card-body text-center">
              <i className={`bi bi-${categoria.icono} icono-categoria`} aria-hidden="true" />
              <h3 className="h6 mt-2 mb-1">{categoria.nombre}</h3>
              <p className="small text-muted mb-0">
                {categoria.productosActivos} {categoria.productosActivos === 1 ? 'producto' : 'productos'}
              </p>
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}
