import { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import Cargando from '../components/Cargando';
import MensajeError from '../components/MensajeError';
import usePeticion from '../hooks/usePeticion';
import { urlImagen } from '../services/api';
import { avisarMensajesLeidos, obtenerConversacion, responderConversacion } from '../services/conversaciones';
import { formatearPrecio } from '../utils/formato';
import { formatearMomento } from '../utils/momento';
import './mensajes.css';

const ACTUALIZAR_CADA = 10_000; // revisa si llegaron mensajes nuevos cada 10 segundos
const MAXIMO = 1000;

// HU-13: una conversación. Al abrirla, el backend marca como leídos los mensajes recibidos.
export default function Conversacion() {
  const { id } = useParams();
  const { datos: conversacion, setDatos, cargando, error, recargar } = usePeticion(() => obtenerConversacion(id), [id]);
  const [texto, setTexto] = useState('');
  const [errorEnvio, setErrorEnvio] = useState('');
  const [enviando, setEnviando] = useState(false);
  const final = useRef(null);
  const cantidad = conversacion?.mensajes.length ?? 0;

  // Revisa cada 10 segundos sin mostrar «cargando» (para no interrumpir mientras se escribe).
  useEffect(() => {
    const intervalo = setInterval(() => {
      obtenerConversacion(id).then(setDatos).catch(() => {});
    }, ACTUALIZAR_CADA);
    return () => clearInterval(intervalo);
  }, [id, setDatos]);

  // Cada vez que cambia la cantidad de mensajes: baja al último y avisa al menú.
  useEffect(() => {
    if (cantidad === 0) return;
    final.current?.scrollIntoView({ block: 'end' });
    avisarMensajesLeidos();
  }, [cantidad]);

  if (cargando) return <Cargando texto="Cargando conversación…" />;
  if (error) {
    return (
      <section className="container py-5">
        <MensajeError error={error} alReintentar={[400, 403, 404].includes(error.estado) ? undefined : recargar} />
        <p className="text-center"><Link to="/mensajes">Volver a mensajes</Link></p>
      </section>
    );
  }

  const otraPersona = conversacion.miRol === 'comprador' ? conversacion.vendedor : conversacion.comprador;
  const { producto } = conversacion;

  const enviar = async (evento) => {
    evento.preventDefault();
    const limpio = texto.trim();
    if (!limpio) return;
    setEnviando(true);
    setErrorEnvio('');
    try {
      setDatos(await responderConversacion(id, limpio));
      setTexto('');
    } catch (falla) {
      setErrorEnvio(falla.message);
    } finally {
      setEnviando(false);
    }
  };

  // Enter envía; Mayúscula + Enter hace un salto de línea.
  const alTeclear = (evento) => {
    if (evento.key === 'Enter' && !evento.shiftKey) enviar(evento);
  };

  return (
    <section className="container py-4 contenedor-mensajes">
      <p className="small mb-2"><Link to="/mensajes"><i className="bi bi-arrow-left me-1" aria-hidden="true" />Mensajes</Link></p>

      <header className="card mb-3">
        <div className="card-body d-flex align-items-center gap-3">
          {producto.imagen !== undefined && (
            <img src={urlImagen(producto.imagen)} alt="" className="miniatura-conversacion rounded" />
          )}
          <div className="flex-grow-1 overflow-hidden">
            <h1 className="h6 mb-0 text-truncate">
              {producto.estado === 'eliminado' ? producto.titulo : <Link to={`/productos/${producto.id}`}>{producto.titulo}</Link>}
            </h1>
            <p className="small text-muted mb-0">
              {conversacion.miRol === 'comprador' ? 'Vendedor' : 'Comprador'}: {otraPersona.nombre}
              {producto.precio !== undefined && ` · ${formatearPrecio(producto.precio)}`}
              {producto.estado !== 'activo' && ` · publicación ${producto.estado}`}
            </p>
          </div>
        </div>
      </header>

      <ol className="list-unstyled hilo" aria-label={`Conversación con ${otraPersona.nombre}`} aria-live="polite">
        {conversacion.mensajes.map((mensaje) => (
          <li key={mensaje.id} className={`burbuja ${mensaje.esMio ? 'burbuja-mia' : 'burbuja-otra'}`}>
            <span className="visually-hidden">{mensaje.esMio ? 'Tú' : otraPersona.nombre}: </span>
            <p className="mb-1">{mensaje.texto}</p>
            <span className="burbuja-hora">
              {formatearMomento(mensaje.enviadoEn)}
              {mensaje.esMio && (
                <i
                  className={`bi ${mensaje.leido ? 'bi-check2-all' : 'bi-check2'} ms-1`}
                  aria-label={mensaje.leido ? 'Leído' : 'Enviado'}
                  title={mensaje.leido ? 'Leído' : 'Enviado'}
                />
              )}
            </span>
          </li>
        ))}
        <li ref={final} aria-hidden="true" />
      </ol>

      <form onSubmit={enviar} className="formulario-mensaje" noValidate>
        <label htmlFor="respuesta" className="visually-hidden">Escribe un mensaje</label>
        <textarea
          id="respuesta"
          rows={2}
          maxLength={MAXIMO}
          className={`form-control ${errorEnvio ? 'is-invalid' : ''}`}
          placeholder={`Escribe a ${otraPersona.nombre}…`}
          value={texto}
          onChange={(evento) => setTexto(evento.target.value)}
          onKeyDown={alTeclear}
          aria-describedby={errorEnvio ? 'error-respuesta' : 'ayuda-respuesta'}
        />
        <button type="submit" className="btn btn-primary" disabled={enviando || !texto.trim()} aria-label="Enviar mensaje">
          <i className="bi bi-send" aria-hidden="true" />
        </button>
        {errorEnvio ? (
          <div id="error-respuesta" className="invalid-feedback d-block w-100">{errorEnvio}</div>
        ) : (
          <div id="ayuda-respuesta" className="form-text w-100">Enter envía · Mayúscula + Enter para un salto de línea.</div>
        )}
      </form>
    </section>
  );
}
