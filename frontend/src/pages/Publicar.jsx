import { useNavigate } from 'react-router-dom';
import FormularioProducto from '../components/FormularioProducto';
import useAvisos from '../hooks/useAvisos';
import { crearProducto } from '../services/productos';

// Publicar un producto nuevo (HU-07).
export default function Publicar() {
  const navegar = useNavigate();
  const { mostrarAviso } = useAvisos();

  const publicar = async (datos) => {
    const producto = await crearProducto(datos);
    mostrarAviso('Tu producto quedó publicado.', 'exito');
    navegar(`/productos/${producto.id}`);
  };

  return (
    <section className="container py-5 formulario-medio">
      <h1 className="h3 mb-1">Publicar un producto</h1>
      <p className="text-muted mb-4">Lo verán todos los estudiantes en el catálogo.</p>
      <FormularioProducto alEnviar={publicar} textoBoton="Publicar" />
    </section>
  );
}
