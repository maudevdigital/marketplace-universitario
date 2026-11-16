import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Cargando from '../components/Cargando';
import EstadoVacio from '../components/EstadoVacio';
import MensajeError from '../components/MensajeError';
import useAvisos from '../hooks/useAvisos';
import usePeticion from '../hooks/usePeticion';
import { urlImagen } from '../services/api';
import { cambiarCantidad, obtenerCarrito, quitarDelCarrito, vaciarCarrito } from '../services/carrito';
import { comprarCarrito } from '../services/pedidos';
import { formatearPrecio } from '../utils/formato';

// Carrito (HU-10). Cada acción devuelve el carrito actualizado y la pantalla lo reemplaza entero.
// Confirmar la compra (HU-11) crea un pedido por vendedor y lleva a «Mis pedidos».
export default function Carrito() {
  const navegar = useNavigate();
  const { mostrarAviso } = useAvisos();
  const { datos: carrito, cargando, error, recargar, setDatos } = usePeticion(obtenerCarrito);
  const [ocupado, setOcupado] = useState(null);

  const ejecutar = async (clave, accion, mensaje) => {
    setOcupado(clave);
    try {
      setDatos(await accion());
      if (mensaje) mostrarAviso(mensaje, 'exito');
    } catch (problema) {
      mostrarAviso(problema.message, 'error');
      recargar(); // el stock pudo cambiar: se muestra lo que hay de verdad
    } finally {
      setOcupado(null);
    }
  };

  const comprar = async () => {
    setOcupado('comprar');
    try {
      const pedidos = await comprarCarrito();
      mostrarAviso(
        pedidos.length === 1 ? 'Compra confirmada: se creó tu pedido.' : `Compra confirmada: se crearon ${pedidos.length} pedidos.`,
        'exito',
      );
      navegar('/pedidos', { state: { nuevos: pedidos.map((pedido) => pedido.id) } });
    } catch (problema) {
      // 409: alguien compró antes o cambió el stock. Nada se cobró; se recarga el carrito para ver qué pasó.
      mostrarAviso(problema.message, 'error');
      recargar();
      setOcupado(null);
    }
  };

  if (cargando) return <Cargando texto="Cargando tu carrito…" />;
  if (error) return <MensajeError error={error} alReintentar={recargar} />;

  if (carrito.items.length === 0) {
    return (
      <section className="container py-5">
        <h1 className="h3 mb-4">Carrito</h1>
        <EstadoVacio icono="cart" titulo="Tu carrito está vacío" texto="Agrega productos desde el catálogo.">
          <Link to="/catalogo" className="btn btn-primary">Ir al catálogo</Link>
        </EstadoVacio>
      </section>
    );
  }

  const conProblemas = carrito.items.filter((item) => item.problema).length;

  return (
    <section className="container py-5">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="h3 mb-0">Carrito</h1>
        <button type="button" className="btn btn-sm btn-outline-danger" disabled={ocupado !== null}
          onClick={() => window.confirm('¿Vaciar el carrito?') && ejecutar('vaciar', vaciarCarrito, 'Vaciaste el carrito.')}>
          <i className="bi bi-trash me-1" aria-hidden="true" />Vaciar
        </button>
      </div>

      <div className="row g-4">
        <div className="col-12 col-lg-8">
          {conProblemas > 0 && (
            <div className="alert alert-warning" role="alert">
              {conProblemas === 1 ? 'Un producto no se puede comprar' : `${conProblemas} productos no se pueden comprar`} tal
              como está. Ajusta la cantidad o sácalo del carrito para continuar.
            </div>
          )}
          <ul className="list-unstyled d-grid gap-3 mb-0">
            {carrito.items.map((item) => (
              <ItemCarrito key={item.producto.id} item={item} ocupado={ocupado !== null}
                alCambiar={(cantidad) => ejecutar(item.producto.id, () => cambiarCantidad(item.producto.id, cantidad))}
                alQuitar={() => ejecutar(item.producto.id, () => quitarDelCarrito(item.producto.id), 'Producto quitado del carrito.')} />
            ))}
          </ul>
        </div>

        <aside className="col-12 col-lg-4" aria-label="Resumen de la compra">
          <div className="card resumen-carrito">
            <div className="card-body">
              <h2 className="h5">Resumen</h2>
              <dl className="d-flex justify-content-between mb-1">
                <dt className="fw-normal">Unidades</dt>
                <dd className="mb-0">{carrito.unidades}</dd>
              </dl>
              <dl className="d-flex justify-content-between mb-3">
                <dt>Total</dt>
                <dd className="mb-0 precio">{formatearPrecio(carrito.total)}</dd>
              </dl>
              {carrito.pedidosAGenerar > 1 && (
                <p className="small text-muted">
                  Compras a {carrito.pedidosAGenerar} vendedores: se creará un pedido para cada uno.
                </p>
              )}
              <button type="button" className="btn btn-primary w-100" disabled={!carrito.sePuedeComprar || ocupado !== null} onClick={comprar}>
                <i className="bi bi-bag-check me-2" aria-hidden="true" />
                {ocupado === 'comprar' ? 'Confirmando…' : 'Confirmar compra'}
              </button>
              <p className="small text-muted mt-2 mb-0">
                El stock se reserva al confirmar. El pago se hace después, desde cada pedido.
              </p>
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
}

function ItemCarrito({ item, ocupado, alCambiar, alQuitar }) {
  const { producto, cantidad, subtotal, problema } = item;
  const tope = Math.max(producto.stock, 1);
  return (
    <li className={`card ${problema ? 'border-warning' : ''}`}>
      <div className="card-body d-flex flex-column flex-sm-row gap-3">
        <img src={urlImagen(producto.imagen)} alt="" className="miniatura rounded"
          onError={(evento) => { evento.currentTarget.src = '/sin-imagen.webp'; }} />
        <div className="flex-grow-1">
          <Link to={`/productos/${producto.id}`} className="fw-semibold titulo-producto text-decoration-none">{producto.titulo}</Link>
          <p className="small text-muted mb-1">
            {formatearPrecio(producto.precio)} c/u · Vende {producto.vendedor.nombre}
          </p>
          {problema && <p className="small text-danger mb-1" role="status"><i className="bi bi-exclamation-circle me-1" aria-hidden="true" />{problema}</p>}
        </div>
        <div className="d-flex flex-sm-column align-items-center align-items-sm-end justify-content-between gap-2">
          <div className="input-group input-group-sm selector-cantidad" role="group" aria-label={`Cantidad de ${producto.titulo}`}>
            <button type="button" className="btn btn-outline-secondary" aria-label="Quitar una unidad"
              disabled={ocupado || cantidad <= 1} onClick={() => alCambiar(cantidad - 1)}>
              <i className="bi bi-dash" aria-hidden="true" />
            </button>
            <span className="input-group-text" aria-live="polite">{cantidad}</span>
            <button type="button" className="btn btn-outline-secondary" aria-label="Agregar una unidad"
              disabled={ocupado || cantidad >= tope || producto.estado !== 'activo'} onClick={() => alCambiar(cantidad + 1)}>
              <i className="bi bi-plus" aria-hidden="true" />
            </button>
          </div>
          {problema && producto.estado === 'activo' && cantidad > producto.stock && (
            <button type="button" className="btn btn-link btn-sm p-0" disabled={ocupado} onClick={() => alCambiar(producto.stock)}>
              Dejar {producto.stock}
            </button>
          )}
          <span className="fw-semibold">{formatearPrecio(subtotal)}</span>
          <button type="button" className="btn btn-sm btn-link text-danger p-0" disabled={ocupado} onClick={alQuitar}>
            Quitar
          </button>
        </div>
      </div>
    </li>
  );
}
