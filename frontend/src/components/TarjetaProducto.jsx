import { Link } from 'react-router-dom';
import { urlImagen } from '../services/api';
import { formatearPrecio, nombreCondicion } from '../utils/formato';

// Tarjeta de un producto tal como lo entrega la API (camposProductoPublico en el backend).
// La usa el perfil del vendedor; el catálogo (HU-06) y favoritos (HU-09) pueden reutilizarla.
// children: acciones extra al pie (botón de favorito, agregar al carrito…).
export default function TarjetaProducto({ producto, children }) {
  return (
    <article className="card tarjeta-producto h-100">
      <img
        src={urlImagen(producto.imagen)}
        alt={producto.titulo}
        className="card-img-top"
        loading="lazy"
        onError={(evento) => {
          evento.currentTarget.src = '/sin-imagen.webp';
        }}
      />
      <div className="card-body d-flex flex-column">
        <div className="d-flex justify-content-between align-items-start gap-2 mb-1">
          <span className="badge text-bg-light etiqueta-categoria">{producto.categoria?.nombre}</span>
          <span className="small text-muted">{nombreCondicion(producto.condicion)}</span>
        </div>
        <h3 className="h6 card-title titulo-producto">{producto.titulo}</h3>
        <p className="precio mt-auto mb-0">{formatearPrecio(producto.precio)}</p>
        <Link to={`/productos/${producto.id}`} className="stretched-link" aria-label={`Ver ${producto.titulo}`} />
      </div>
      {children && <div className="card-footer bg-transparent">{children}</div>}
    </article>
  );
}
