import { router } from 'expo-router';
import { Alert } from 'react-native';
import FormularioProducto from '../../components/FormularioProducto';
import { crearProducto } from '../../services/servicios';

// Publicar un producto (POST /productos, con foto opcional). El formulario es el mismo de «Editar».
export default function Publicar() {
  const publicar = async (datos) => {
    const creado = await crearProducto(datos);
    Alert.alert('Publicado', 'Tu producto ya aparece en el catálogo.');
    router.push(`/productos/${creado.id}`);
  };
  return <FormularioProducto alEnviar={publicar} textoBoton="Publicar" />;
}
