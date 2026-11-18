import { router, useLocalSearchParams } from 'expo-router';
import { Alert } from 'react-native';
import { Cargando, MensajeError } from '../../../components/Estados';
import FormularioProducto from '../../../components/FormularioProducto';
import usePeticion from '../../../hooks/usePeticion';
import useSesion from '../../../hooks/useSesion';
import { actualizarProducto, obtenerProducto } from '../../../services/servicios';

// Editar una publicación propia (PATCH /productos/:id). Si no es mía, el backend responde 403;
// aquí se avisa antes para no mostrar un formulario que no se va a poder guardar.
export default function EditarProducto() {
  const { id } = useLocalSearchParams();
  const { usuario } = useSesion();
  const { datos: producto, error, recargar } = usePeticion(() => obtenerProducto(id), [id]);

  if (error) return <MensajeError error={error} alReintentar={error.estado === 404 ? undefined : recargar} />;
  if (!producto) return <Cargando />;
  if (producto.vendedor.id !== usuario.id) {
    return <MensajeError error={{ message: 'Solo quien publicó un producto puede editarlo.' }} />;
  }

  const guardar = async (datos) => {
    await actualizarProducto(producto.id, datos);
    Alert.alert('Cambios guardados', 'La publicación quedó actualizada.');
    router.back();
  };
  return <FormularioProducto producto={producto} alEnviar={guardar} textoBoton="Guardar cambios" />;
}
