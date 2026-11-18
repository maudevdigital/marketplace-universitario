import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { colores } from '../tema';

// Los estados que toda pantalla puede mostrar: cargando, error y vacío (igual que en la web).

export function Cargando({ texto = 'Cargando…' }) {
  return (
    <View style={estilos.centro} accessibilityRole="progressbar" accessibilityLabel={texto}>
      <ActivityIndicator size="large" color={colores.primario} />
      <Text style={estilos.textoSuave}>{texto}</Text>
    </View>
  );
}

export function MensajeError({ error, alReintentar }) {
  return (
    <View style={estilos.centro}>
      <Ionicons name="cloud-offline-outline" size={40} color={colores.peligro} />
      <Text style={estilos.titulo}>Algo salió mal</Text>
      <Text style={estilos.textoSuave}>{error?.message ?? 'Ocurrió un error inesperado.'}</Text>
      {alReintentar && (
        <Pressable style={estilos.boton} onPress={alReintentar} accessibilityRole="button">
          <Text style={estilos.textoBoton}>Reintentar</Text>
        </Pressable>
      )}
    </View>
  );
}

export function EstadoVacio({ icono = 'file-tray-outline', titulo, texto }) {
  return (
    <View style={estilos.centro}>
      <Ionicons name={icono} size={40} color={colores.textoSuave} />
      <Text style={estilos.titulo}>{titulo}</Text>
      {texto && <Text style={estilos.textoSuave}>{texto}</Text>}
    </View>
  );
}

const estilos = StyleSheet.create({
  centro: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 8 },
  titulo: { fontSize: 17, fontWeight: '600', color: colores.texto, textAlign: 'center' },
  textoSuave: { color: colores.textoSuave, textAlign: 'center' },
  boton: { marginTop: 8, backgroundColor: colores.primario, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8 },
  textoBoton: { color: '#fff', fontWeight: '600' },
});
