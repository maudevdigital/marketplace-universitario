import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import useAvisos from '../hooks/useAvisos';
import useSesion from '../hooks/useSesion';
import { preguntarPorProducto } from '../services/conversaciones';

const MAXIMO = 1000;

// HU-13: botón «Preguntar al vendedor» del detalle de producto.
// Sin sesión invita a ingresar; en un producto propio no se muestra.
export default function PreguntarVendedor({ producto }) {
  const { usuario } = useSesion();
  const { mostrarAviso } = useAvisos();
  const navegar = useNavigate();
  const ubicacion = useLocation();
  const [abierto, setAbierto] = useState(false);
  const [texto, setTexto] = useState('');
  const [error, setError] = useState('');
  const [enviando, setEnviando] = useState(false);

  if (usuario?.id === producto.vendedor.id) return null;

  if (!usuario) {
    return (
      <p className="small mb-3">
        <Link to="/ingresar" state={{ desde: ubicacion.pathname }}>Inicia sesión</Link> para preguntarle al vendedor.
      </p>
    );
  }

  const enviar = async (evento) => {
    evento.preventDefault();
    const limpio = texto.trim();
    if (!limpio) {
      setError('Escribe tu pregunta.');
      return;
    }
    setEnviando(true);
    setError('');
    try {
      const conversacion = await preguntarPorProducto(producto.id, limpio);
      mostrarAviso('Tu pregunta se envió al vendedor.', 'exito');
      navegar(`/mensajes/${conversacion.id}`);
    } catch (falla) {
      setError(falla.message);
      setEnviando(false);
    }
  };

  if (!abierto) {
    return (
      <button type="button" className="btn btn-outline-primary mb-3" onClick={() => setAbierto(true)}>
        <i className="bi bi-chat-dots me-1" aria-hidden="true" />Preguntar al vendedor
      </button>
    );
  }

  return (
    <form onSubmit={enviar} className="card card-body mb-3" noValidate>
      <label htmlFor="pregunta" className="form-label fw-semibold">
        Tu pregunta para {producto.vendedor.nombre}
      </label>
      <textarea
        id="pregunta"
        rows={3}
        maxLength={MAXIMO}
        className={`form-control ${error ? 'is-invalid' : ''}`}
        placeholder="Por ejemplo: ¿sigue disponible? ¿Dónde lo puedes entregar?"
        value={texto}
        onChange={(evento) => setTexto(evento.target.value)}
        aria-describedby={error ? 'error-pregunta' : undefined}
        autoFocus
      />
      {error && <div id="error-pregunta" className="invalid-feedback">{error}</div>}
      <div className="d-flex justify-content-between align-items-center mt-2 gap-2">
        <span className="small text-muted">{texto.length} de {MAXIMO}</span>
        <div className="d-flex gap-2">
          <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => setAbierto(false)}>
            Cancelar
          </button>
          <button type="submit" className="btn btn-sm btn-primary" disabled={enviando}>
            {enviando ? 'Enviando…' : 'Enviar pregunta'}
          </button>
        </div>
      </div>
    </form>
  );
}
