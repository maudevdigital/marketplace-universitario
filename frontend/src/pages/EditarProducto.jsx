import { Link, useNavigate, useParams } from 'react-router-dom';
import Cargando from '../components/Cargando';
import EstadoVacio from '../components/EstadoVacio';
import FormularioProducto from '../components/FormularioProducto';
import MensajeError from '../components/MensajeError';
import useAvisos from '../hooks/useAvisos';
import usePeticion from '../hooks/usePeticion';
import useSesion from '../hooks/useSesion';
import { actualizarProducto, obtenerProducto } from '../services/productos';

// Editar una publicación propia (HU-07). El backend vuelve a revisar que sea del usuario (403).
export default function EditarProducto() {
  const { id } = useParams();
  const { usuario } = useSesion();
  const navegar = useNavigate();
  const { mostrarAviso } = useAvisos();
  const { datos: producto, cargando, error, recargar } = usePeticion(() => obtenerProducto(id), [id]);

  if (cargando) return <Cargando texto="Cargando publicación…" />;
  if (error) return <MensajeError error={error} alReintentar={[400, 404].includes(error.estado) ? undefined : recargar} />;

  if (producto.vendedor.id !== usuario.id) {
    return (
      <EstadoVacio icono="shield-lock" titulo="No puedes editar esta publicación" texto="Solo quien la publicó puede modificarla.">
        <Link to={`/productos/${producto.id}`} className="btn btn-outline-primary">Ver la publicación</Link>
      </EstadoVacio>
    );
  }

  const guardar = async (datos) => {
    await actualizarProducto(producto.id, datos);
    mostrarAviso('Los cambios quedaron guardados.', 'exito');
    navegar('/mis-publicaciones');
  };

  return (
    <section className="container py-5 formulario-medio">
      <h1 className="h3 mb-4">Editar publicación</h1>
      <FormularioProducto producto={producto} alEnviar={guardar} textoBoton="Guardar cambios" />
    </section>
  );
}
