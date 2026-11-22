import { Ionicons } from '@expo/vector-icons';
import { Image, StyleSheet, View } from 'react-native';
import { urlImagen } from '../services/api';
import { colores } from '../tema';

// Foto de un producto servida por el backend, o un ícono si la publicación no tiene foto.
export default function FotoProducto({ ruta, style }) {
  const url = urlImagen(ruta);
  if (!url) {
    return (
      <View style={[estilos.sinFoto, style]} accessibilityLabel="Sin foto">
        <Ionicons name="image-outline" size={28} color={colores.textoSuave} />
      </View>
    );
  }
  return <Image source={{ uri: url }} style={[estilos.foto, style]} resizeMode="cover" accessibilityIgnoresInvertColors />;
}

const estilos = StyleSheet.create({
  foto: { backgroundColor: colores.fondoSuave },
  sinFoto: { backgroundColor: colores.fondoSuave, alignItems: 'center', justifyContent: 'center' },
});
