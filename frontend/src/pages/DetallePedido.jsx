import { Link, useParams } from 'react-router-dom';
import AccionesPedido from '../components/AccionesPedido';
import Cargando from '../components/Cargando';
import EstadoPedido from '../components/EstadoPedido';
import LineaTiempoPedido from '../components/LineaTiempoPedido';
import MensajeError from '../components/MensajeError';
import usePeticion from '../hooks/usePeticion';
import { urlImagen } from '../services/api';
import { obtenerPedido } from '../services/pedidos';
import { formatearFecha, formatearPrecio } from '../utils/formato';

// Detalle de un pedido (HU-11): productos, montos y la otra persona del pedido.
// HU-12: seguimiento, pago simulado, entrega y cancelación.
export default function DetallePedido() {
  const { id } = useParams();
  // setDatos: las acciones devuelven el pedido actualizado y la pantalla lo reemplaza sin recargar.
  const { datos: pedido, cargando, error, recargar, setDatos } = usePeticion(() => obtenerPedido(id), [id]);

  if (cargando) return <Cargando texto="Cargando pedido…" />;
  if (error) {
    return (
      <section className="container py-5">
        <MensajeError error={error} alReintentar={[400, 403, 404].includes(error.estado) ? undefined : recargar} />
        <p className="text-center"><Link to="/pedidos">Volver a mis pedidos</Link></p>
      </section>
    );
  }

  const soyComprador = pedido.miRol === 'comprador';
  const contraparte = soyComprador ? pedido.vendedor : pedido.comprador;

  return (
    <section className="container py-5">
      <Link to={soyComprador ? '/pedidos' : '/ventas'} className="small d-inline-block mb-3">
        <i className="bi bi-arrow-left me-1" aria-hidden="true" />
        {soyComprador ? 'Mis pedidos' : 'Mis ventas'}
      </Link>

      <header className="d-flex flex-wrap align-items-center gap-2 mb-1">
        <h1 className="h3 mb-0">Pedido #{pedido.id}</h1>
        <EstadoPedido estado={pedido.estado} />
      </header>
      <p className="text-muted mb-4">Creado el {formatearFecha(pedido.creadoEn)}</p>

      <div className="row g-4">
        <div className="col-12 col-lg-8">
          <div className="card">
            <ul className="list-group list-group-flush">
              {pedido.detalles.map((detalle) => (
                <li key={detalle.id} className="list-group-item d-flex gap-3 align-items-center">
                  <img src={urlImagen(detalle.producto.imagen)} alt="" className="miniatura rounded"
                    onError={(evento) => { evento.currentTarget.src = '/sin-imagen.webp'; }} />
                  <div className="flex-grow-1">
                    <Link to={`/productos/${detalle.producto.id}`} className="titulo-producto text-decoration-none fw-semibold">
                      {detalle.producto.titulo}
                    </Link>
                    <p className="small text-muted mb-0">
                      {detalle.cantidad} × {formatearPrecio(detalle.precioUnitario)}
                    </p>
                  </div>
                  <span className="fw-semibold">{formatearPrecio(detalle.subtotal)}</span>
                </li>
              ))}
              <li className="list-group-item d-flex justify-content-between">
                <strong>Total</strong>
                <span className="precio">{formatearPrecio(pedido.total)}</span>
              </li>
            </ul>
          </div>
        </div>

        <aside className="col-12 col-lg-4 d-grid gap-3 align-content-start">
          <div className="card">
            <div className="card-body d-flex align-items-center gap-3">
              <div className="avatar avatar-chico" aria-hidden="true">{contraparte.nombre.charAt(0)}</div>
              <div className="flex-grow-1">
                <p className="small text-muted mb-0">{soyComprador ? 'Vendedor' : 'Comprador'}</p>
                <p className="mb-0 fw-semibold">{contraparte.nombre}</p>
              </div>
              <Link to={`/usuarios/${contraparte.id}`} className="btn btn-sm btn-outline-primary">Perfil</Link>
            </div>
          </div>
          <AccionesPedido pedido={pedido} alActualizar={setDatos} />
          <LineaTiempoPedido pedido={pedido} />
        </aside>
      </div>
    </section>
  );
}
