import { Link } from 'expo-router';
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { Cargando, EstadoVacio, MensajeError } from '../../components/Estados';
import usePeticion from '../../hooks/usePeticion';
import useRecargarAlVolver from '../../hooks/useRecargarAlVolver';
import { listarConversaciones } from '../../services/servicios';
import { colores } from '../../tema';
import { formatearMomento } from '../../utils/momento';

// Bandeja de mensajes (GET /conversaciones, guardadas en MongoDB): como comprador y como vendedor.
export default function Mensajes() {
  const { datos, cargando, error, recargar } = usePeticion(listarConversaciones);
  useRecargarAlVolver(recargar);

  if (error) return <MensajeError error={error} alReintentar={recargar} />;
  if (!datos) return <Cargando texto="Cargando mensajes…" />;

  return (
    <View style={{ flex: 1, backgroundColor: colores.fondo }}>
      <FlatList
        data={datos}
        keyExtractor={(conversacion) => conversacion.id}
        renderItem={({ item }) => <FilaConversacion conversacion={item} />}
        refreshControl={<RefreshControl refreshing={cargando} onRefresh={recargar} />}
        ListEmptyComponent={
          <EstadoVacio icono="chatbubbles-outline" titulo="Aún no tienes mensajes"
            texto="Abre un producto y pregúntale al vendedor." />
        }
        contentContainerStyle={datos.length === 0 && { flexGrow: 1 }}
      />
    </View>
  );
}

function FilaConversacion({ conversacion }) {
  const { otraPersona, producto, ultimoMensaje, noLeidos, miRol } = conversacion;
  return (
    <Link href={`/mensajes/${conversacion.id}`} asChild>
      <Pressable style={estilos.fila} accessibilityRole="button" accessibilityLabel={`Conversación con ${otraPersona.nombre}`}>
        <View style={estilos.avatar}>
          <Text style={estilos.inicial}>{otraPersona.nombre.charAt(0).toUpperCase()}</Text>
        </View>
        <View style={{ flex: 1, gap: 2 }}>
          <View style={estilos.cabecera}>
            <Text style={[estilos.nombre, noLeidos > 0 && { fontWeight: '800' }]} numberOfLines={1}>{otraPersona.nombre}</Text>
            <Text style={estilos.suave}>{formatearMomento(conversacion.ultimoMensajeEn)}</Text>
          </View>
          <Text style={estilos.suave} numberOfLines={1}>
            {miRol === 'comprador' ? 'Compras' : 'Vendes'}: {producto.titulo}
          </Text>
          <View style={estilos.cabecera}>
            <Text style={[estilos.ultimo, noLeidos > 0 && { color: colores.texto, fontWeight: '600' }]} numberOfLines={1}>
              {ultimoMensaje.esMio ? 'Tú: ' : ''}{ultimoMensaje.texto}
            </Text>
            {noLeidos > 0 && (
              <View style={estilos.insignia}>
                <Text style={estilos.textoInsignia}>{noLeidos}</Text>
              </View>
            )}
          </View>
        </View>
      </Pressable>
    </Link>
  );
}

const estilos = StyleSheet.create({
  fila: { flexDirection: 'row', gap: 12, padding: 14, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colores.borde },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: colores.primarioClaro, alignItems: 'center', justifyContent: 'center' },
  inicial: { color: '#fff', fontWeight: '800', fontSize: 18 },
  cabecera: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  nombre: { fontWeight: '600', color: colores.texto, flex: 1 },
  suave: { color: colores.textoSuave, fontSize: 13 },
  ultimo: { color: colores.textoSuave, flex: 1 },
  insignia: { backgroundColor: colores.peligro, borderRadius: 10, minWidth: 20, paddingHorizontal: 6, alignItems: 'center' },
  textoInsignia: { color: '#fff', fontWeight: '700', fontSize: 12 },
});
