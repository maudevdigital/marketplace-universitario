import { useState } from 'react';
import { Link } from 'react-router-dom';
import Cargando from '../components/Cargando';
import EstadoVacio from '../components/EstadoVacio';
import MensajeError from '../components/MensajeError';
import useAvisos from '../hooks/useAvisos';
import usePeticion from '../hooks/usePeticion';
import { urlImagen } from '../services/api';
import { actualizarProducto, eliminarProducto, listarMisProductos } from '../services/productos';
import { formatearPrecio } from '../utils/formato';

const ESTADOS = {
  activo: { texto: 'Activa', clase: 'text-bg-success' },
  pausado: { texto: 'Pausada', clase: 'text-bg-secondary' },
  agotado: { texto: 'Agotada', clase: 'text-bg-warning' },
};

// Mis publicaciones (HU-07): ver, editar, pausar, reactivar y eliminar lo que publiqué.
export default function MisPublicaciones() {
  const { mostrarAviso } = useAvisos();
  const { datos: productos, cargando, error, recargar, setDatos } = usePeticion(listarMisProductos);
  const [ocupado, setOcupado] = useState(null);

  const cambiarEstado = async (producto, estado) => {
    const datos = new FormData();
    datos.append('estado', estado);
    setOcupado(producto.id);
    try {
      const actualizado = await actualizarProducto(producto.id, datos);
      setDatos((lista) => lista.map((item) => (item.id === actualizado.id ? actualizado : item)));
      mostrarAviso(estado === 'pausado' ? 'La publicación quedó pausada.' : 'La publicación volvió al catálogo.', 'exito');
    } catch (problema) {
      mostrarAviso(problema.message, 'error');
    } finally {
      setOcupado(null);
    }
  };

  const eliminar = async (producto) => {
    if (!window.confirm(`¿Eliminar «${producto.titulo}»? Esta acción no se puede deshacer.`)) return;
    setOcupado(producto.id);
    try {
      const respuesta = await eliminarProducto(producto.id);
      setDatos((lista) => lista.filter((item) => item.id !== producto.id));
      mostrarAviso(respuesta.mensaje, 'exito');
    } catch (problema) {
      mostrarAviso(problema.message, 'error');
    } finally {
      setOcupado(null);
    }
  };

  return (
    <section className="container py-5">
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-4">
        <h1 className="h3 mb-0">Mis publicaciones</h1>
        <Link to="/publicar" className="btn btn-primary">
          <i className="bi bi-plus-lg me-1" aria-hidden="true" />Publicar
        </Link>
      </div>

      {cargando && <Cargando texto="Cargando tus publicaciones…" />}
      {error && <MensajeError error={error} alReintentar={recargar} />}
      {productos?.length === 0 && (
        <EstadoVacio icono="bag-plus" titulo="Todavía no publicas nada" texto="Vende lo que ya no usas a otros estudiantes.">
          <Link to="/publicar" className="btn btn-primary">Publicar mi primer producto</Link>
        </EstadoVacio>
      )}

      {productos?.length > 0 && (
        <ul className="list-unstyled d-grid gap-3">
          {productos.map((producto) => {
            const estado = ESTADOS[producto.estado];
            const deshabilitado = ocupado === producto.id;
            return (
              <li key={producto.id} className="card">
                <div className="card-body d-flex flex-column flex-md-row gap-3 align-items-md-center">
                  <img src={urlImagen(producto.imagen)} alt="" className="miniatura rounded"
                    onError={(evento) => { evento.currentTarget.src = '/sin-imagen.webp'; }} />
                  <div className="flex-grow-1">
                    <Link to={`/productos/${producto.id}`} className="fw-semibold titulo-producto text-decoration-none">
                      {producto.titulo}
                    </Link>
                    <p className="mb-0 small text-muted">
                      {formatearPrecio(producto.precio)} · {producto.stock} {producto.stock === 1 ? 'unidad' : 'unidades'} · {producto.categoria.nombre}
                    </p>
                  </div>
                  <span className={`badge ${estado.clase} align-self-start align-self-md-center`}>{estado.texto}</span>
                  <div className="d-flex flex-wrap gap-2">
                    <Link to={`/productos/${producto.id}/editar`} className="btn btn-sm btn-outline-primary">
                      <i className="bi bi-pencil me-1" aria-hidden="true" />Editar
                    </Link>
                    {producto.estado === 'activo' && (
                      <button type="button" className="btn btn-sm btn-outline-secondary" disabled={deshabilitado}
                        onClick={() => cambiarEstado(producto, 'pausado')}>
                        <i className="bi bi-pause me-1" aria-hidden="true" />Pausar
                      </button>
                    )}
                    {producto.estado === 'pausado' && (
                      <button type="button" className="btn btn-sm btn-outline-success" disabled={deshabilitado}
                        onClick={() => cambiarEstado(producto, 'activo')}>
                        <i className="bi bi-play me-1" aria-hidden="true" />Reactivar
                      </button>
                    )}
                    <button type="button" className="btn btn-sm btn-outline-danger" disabled={deshabilitado}
                      onClick={() => eliminar(producto)} aria-label={`Eliminar ${producto.titulo}`}>
                      <i className="bi bi-trash" aria-hidden="true" />
                    </button>
                  </div>
                </div>
                {producto.estado === 'agotado' && (
                  <p className="card-footer bg-transparent small mb-0 text-muted">
                    Sin unidades: edita la publicación y agrega stock para que vuelva al catálogo.
                  </p>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
