import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import useAvisos from '../hooks/useAvisos';
import useFavoritos from '../hooks/useFavoritos';
import useSesion from '../hooks/useSesion';

// Corazón para marcar o quitar un favorito (HU-09). Sin sesión, lleva a iniciar sesión y vuelve.
// conTexto: muestra «Guardar en favoritos» junto al ícono (en el detalle del producto).
export default function BotonFavorito({ producto, conTexto = false, alCambiar }) {
  const { usuario } = useSesion();
  const { esFavorito, alternar } = useFavoritos();
  const { mostrarAviso } = useAvisos();
  const navegar = useNavigate();
  const ubicacion = useLocation();
  const [ocupado, setOcupado] = useState(false);

  // La propia publicación no se guarda como favorita: el botón no aparece.
  if (usuario?.id === producto.vendedor?.id) return null;

  const marcado = esFavorito(producto.id);
  const etiqueta = marcado ? `Quitar ${producto.titulo} de favoritos` : `Guardar ${producto.titulo} en favoritos`;

  const pulsar = async () => {
    if (!usuario) {
      navegar('/ingresar', { state: { desde: ubicacion.pathname + ubicacion.search } });
      return;
    }
    setOcupado(true);
    try {
      const ahora = await alternar(producto.id);
      mostrarAviso(ahora ? 'Guardado en favoritos.' : 'Quitado de favoritos.', 'exito');
      alCambiar?.(ahora);
    } catch (error) {
      mostrarAviso(error.message, 'error');
    } finally {
      setOcupado(false);
    }
  };

  return (
    <button
      type="button"
      className={`btn ${conTexto ? '' : 'btn-sm'} boton-favorito ${marcado ? 'marcado' : ''}`}
      onClick={pulsar}
      disabled={ocupado}
      aria-pressed={marcado}
      aria-label={conTexto ? undefined : etiqueta}
      title={etiqueta}
    >
      <i className={`bi ${marcado ? 'bi-heart-fill' : 'bi-heart'}`} aria-hidden="true" />
      {conTexto && <span className="ms-2">{marcado ? 'En favoritos' : 'Guardar en favoritos'}</span>}
    </button>
  );
}
