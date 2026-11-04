import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import useAvisos from '../hooks/useAvisos';
import useSesion from '../hooks/useSesion';
import { agregarAlCarrito } from '../services/carrito';

// Selector de cantidad y botón «Agregar al carrito» del detalle de producto (HU-10).
// El tope es el stock; el backend lo vuelve a revisar sumando lo que ya había en el carrito.
export default function AgregarAlCarrito({ producto }) {
  const { usuario } = useSesion();
  const { mostrarAviso } = useAvisos();
  const navegar = useNavigate();
  const ubicacion = useLocation();
  const [cantidad, setCantidad] = useState(1);
  const [enviando, setEnviando] = useState(false);
  const [agregado, setAgregado] = useState(false);

  if (usuario?.id === producto.vendedor.id || producto.estado !== 'activo') return null;

  const agregar = async (evento) => {
    evento.preventDefault();
    if (!usuario) {
      navegar('/ingresar', { state: { desde: ubicacion.pathname } });
      return;
    }
    setEnviando(true);
    try {
      await agregarAlCarrito(producto.id, cantidad);
      setAgregado(true);
      mostrarAviso(cantidad === 1 ? 'Agregado al carrito.' : `Agregaste ${cantidad} unidades al carrito.`, 'exito');
    } catch (error) {
      mostrarAviso(error.message, 'error');
    } finally {
      setEnviando(false);
    }
  };

  const ajustar = (valor) => setCantidad(Math.min(producto.stock, Math.max(1, Number(valor) || 1)));

  return (
    <form onSubmit={agregar} className="d-flex flex-wrap align-items-end gap-2 mb-3">
      {producto.stock > 1 && (
        <div>
          <label htmlFor="cantidad" className="form-label small mb-1">Cantidad</label>
          <input id="cantidad" type="number" min="1" max={producto.stock} step="1" inputMode="numeric"
            className="form-control campo-cantidad" value={cantidad} onChange={(evento) => ajustar(evento.target.value)} />
        </div>
      )}
      <button type="submit" className="btn btn-primary" disabled={enviando}>
        <i className="bi bi-cart-plus me-2" aria-hidden="true" />
        {enviando ? 'Agregando…' : 'Agregar al carrito'}
      </button>
      {agregado && <Link to="/carrito" className="btn btn-outline-primary">Ver carrito</Link>}
    </form>
  );
}
