import { Link, useLocation } from 'react-router-dom';
import Cargando from '../components/Cargando';
import EstadoPedido from '../components/EstadoPedido';
import EstadoVacio from '../components/EstadoVacio';
import MensajeError from '../components/MensajeError';
import usePeticion from '../hooks/usePeticion';
import { listarPedidos } from '../services/pedidos';
import { formatearFecha, formatearPrecio } from '../utils/formato';

const TEXTOS = {
  comprador: {
    titulo: 'Mis pedidos',
    vacio: 'Todavía no compras nada',
    textoVacio: 'Cuando compres algo, aquí podrás seguir el pedido.',
    contraparte: (pedido) => `Vende ${pedido.vendedor.nombre}`,
  },
  vendedor: {
    titulo: 'Mis ventas',
    vacio: 'Todavía no vendes nada',
    textoVacio: 'Cuando alguien compre una de tus publicaciones, aparecerá aquí.',
    contraparte: (pedido) => `Compra ${pedido.comprador.nombre}`,
  },
};

// Mis pedidos y Mis ventas (HU-11): la misma pantalla con el rol cambiado.
export default function ListaPedidos({ rol }) {
  const textos = TEXTOS[rol];
  const ubicacion = useLocation();
  const { datos: pedidos, cargando, error, recargar } = usePeticion(() => listarPedidos(rol), [rol]);
  // Pedidos recién creados desde el carrito: se destacan en la lista.
  const nuevos = new Set(ubicacion.state?.nuevos ?? []);

  return (
    <section className="container py-5">
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-4">
        <h1 className="h3 mb-0">{textos.titulo}</h1>
        <nav className="btn-group" aria-label="Compras o ventas">
          <Link to="/pedidos" className={`btn btn-sm ${rol === 'comprador' ? 'btn-primary' : 'btn-outline-primary'}`}
            aria-current={rol === 'comprador' ? 'page' : undefined}>Compras</Link>
          <Link to="/ventas" className={`btn btn-sm ${rol === 'vendedor' ? 'btn-primary' : 'btn-outline-primary'}`}
            aria-current={rol === 'vendedor' ? 'page' : undefined}>Ventas</Link>
        </nav>
      </div>

      {cargando && <Cargando texto="Cargando pedidos…" />}
      {error && <MensajeError error={error} alReintentar={recargar} />}
      {pedidos?.length === 0 && (
        <EstadoVacio icono={rol === 'comprador' ? 'bag' : 'cash-coin'} titulo={textos.vacio} texto={textos.textoVacio}>
          {rol === 'comprador' && <Link to="/catalogo" className="btn btn-primary">Ir al catálogo</Link>}
        </EstadoVacio>
      )}

      {pedidos?.length > 0 && (
        <ul className="list-unstyled d-grid gap-3">
          {pedidos.map((pedido) => (
            <li key={pedido.id} className={`card tarjeta-pedido ${nuevos.has(pedido.id) ? 'border-success' : ''}`}>
              <div className="card-body d-flex flex-column flex-md-row gap-2 align-items-md-center">
                <div className="flex-grow-1">
                  <div className="d-flex flex-wrap align-items-center gap-2 mb-1">
                    <Link to={`/pedidos/${pedido.id}`} className="fw-semibold stretched-link text-decoration-none">
                      Pedido #{pedido.id}
                    </Link>
                    <EstadoPedido estado={pedido.estado} />
                    {nuevos.has(pedido.id) && <span className="badge text-bg-success">Nuevo</span>}
                  </div>
                  <p className="small mb-0 text-truncate">
                    {pedido.detalles.map((detalle) => `${detalle.cantidad} × ${detalle.producto.titulo}`).join(' · ')}
                  </p>
                  <p className="small text-muted mb-0">
                    {textos.contraparte(pedido)} · {formatearFecha(pedido.creadoEn)}
                  </p>
                </div>
                <span className="precio">{formatearPrecio(pedido.total)}</span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
