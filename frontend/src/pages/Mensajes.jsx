import { Link } from 'react-router-dom';
import Cargando from '../components/Cargando';
import EstadoVacio from '../components/EstadoVacio';
import MensajeError from '../components/MensajeError';
import usePeticion from '../hooks/usePeticion';
import { listarConversaciones } from '../services/conversaciones';
import { formatearMomento } from '../utils/momento';
import './mensajes.css';

// HU-13: bandeja de conversaciones, como comprador y como vendedor.
export default function Mensajes() {
  const { datos: conversaciones, cargando, error, recargar } = usePeticion(listarConversaciones);

  return (
    <section className="container py-5 contenedor-mensajes">
      <h1 className="h3 mb-4">Mensajes</h1>
      {cargando && <Cargando texto="Cargando tus conversaciones…" />}
      {error && <MensajeError error={error} alReintentar={recargar} />}
      {conversaciones?.length === 0 && (
        <EstadoVacio
          icono="chat-dots"
          titulo="Todavía no tienes mensajes"
          texto="Cuando preguntes por un producto, o alguien pregunte por los tuyos, la conversación aparecerá aquí."
        >
          <Link to="/catalogo" className="btn btn-primary">Ir al catálogo</Link>
        </EstadoVacio>
      )}
      {conversaciones?.length > 0 && (
        <ul className="list-unstyled bandeja">
          {conversaciones.map((conversacion) => (
            <li key={conversacion.id}>
              <Link
                to={`/mensajes/${conversacion.id}`}
                className={`bandeja-item ${conversacion.noLeidos > 0 ? 'bandeja-item-nuevo' : ''}`}
              >
                <div className="avatar avatar-chico" aria-hidden="true">{conversacion.otraPersona.nombre.charAt(0)}</div>
                <div className="flex-grow-1 overflow-hidden">
                  <div className="d-flex justify-content-between gap-2">
                    <span className="fw-semibold text-truncate">{conversacion.otraPersona.nombre}</span>
                    <span className="small text-muted text-nowrap">{formatearMomento(conversacion.ultimoMensajeEn)}</span>
                  </div>
                  <div className="small text-muted text-truncate">
                    <span className={`badge me-1 ${conversacion.miRol === 'vendedor' ? 'text-bg-warning' : 'text-bg-light'}`}>
                      {conversacion.miRol === 'vendedor' ? 'Te preguntan' : 'Preguntaste'}
                    </span>
                    {conversacion.producto.titulo}
                  </div>
                  <div className="small text-truncate">
                    {conversacion.ultimoMensaje.esMio && <span className="text-muted">Tú: </span>}
                    {conversacion.ultimoMensaje.texto}
                  </div>
                </div>
                {conversacion.noLeidos > 0 && (
                  <span className="badge rounded-pill text-bg-danger align-self-center">
                    {conversacion.noLeidos}
                    <span className="visually-hidden"> sin leer</span>
                  </span>
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
