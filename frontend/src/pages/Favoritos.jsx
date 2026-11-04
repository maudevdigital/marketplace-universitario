import { Link } from 'react-router-dom';
import BotonFavorito from '../components/BotonFavorito';
import Cargando from '../components/Cargando';
import EstadoVacio from '../components/EstadoVacio';
import MensajeError from '../components/MensajeError';
import TarjetaProducto from '../components/TarjetaProducto';
import usePeticion from '../hooks/usePeticion';
import { listarFavoritos } from '../services/favoritos';

const NO_DISPONIBLE = { pausado: 'Pausado por el vendedor', agotado: 'Agotado' };

// Mis favoritos (HU-09). Al quitar uno desaparece de la lista sin recargar.
export default function Favoritos() {
  const { datos: productos, cargando, error, recargar, setDatos } = usePeticion(listarFavoritos);

  const quitarDeLaLista = (productoId) => setDatos((lista) => lista.filter((producto) => producto.id !== productoId));

  return (
    <section className="container py-5">
      <h1 className="h3 mb-4">Mis favoritos</h1>

      {cargando && <Cargando texto="Cargando tus favoritos…" />}
      {error && <MensajeError error={error} alReintentar={recargar} />}
      {productos?.length === 0 && (
        <EstadoVacio icono="heart" titulo="Todavía no guardas favoritos" texto="Toca el corazón de un producto para encontrarlo después.">
          <Link to="/catalogo" className="btn btn-primary">Ir al catálogo</Link>
        </EstadoVacio>
      )}

      {productos?.length > 0 && (
        <ul className="row g-3 list-unstyled">
          {productos.map((producto) => (
            <li key={producto.id} className="col-12 col-sm-6 col-lg-4 col-xl-3">
              <TarjetaProducto producto={producto}>
                <div className="d-flex justify-content-between align-items-center">
                  <span className="small text-muted">{NO_DISPONIBLE[producto.estado] ?? 'Disponible'}</span>
                  <BotonFavorito producto={producto} alCambiar={(marcado) => !marcado && quitarDeLaLista(producto.id)} />
                </div>
              </TarjetaProducto>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
