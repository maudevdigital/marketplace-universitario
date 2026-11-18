import { Stack, useLocalSearchParams } from 'expo-router';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { Cargando, EstadoVacio, MensajeError } from '../../components/Estados';
import TarjetaProducto from '../../components/TarjetaProducto';
import usePeticion from '../../hooks/usePeticion';
import { obtenerPerfil } from '../../services/servicios';
import { colores, formatearFecha } from '../../tema';

// Perfil público de un vendedor (GET /usuarios/:id) con sus publicaciones activas.
export default function PerfilVendedor() {
  const { id } = useLocalSearchParams();
  const { datos: perfil, error, recargar } = usePeticion(() => obtenerPerfil(id), [id]);

  if (error) return <MensajeError error={error} alReintentar={error.estado === 404 ? undefined : recargar} />;
  if (!perfil) return <Cargando />;

  return (
    <FlatList
      style={{ flex: 1, backgroundColor: colores.fondo }}
      data={perfil.publicaciones}
      keyExtractor={(producto) => String(producto.id)}
      renderItem={({ item }) => <TarjetaProducto producto={item} />}
      ListHeaderComponent={
        <View style={estilos.cabecera}>
          <Stack.Screen options={{ title: perfil.nombre }} />
          <View style={estilos.avatar}>
            <Text style={estilos.inicial}>{perfil.nombre.charAt(0).toUpperCase()}</Text>
          </View>
          <Text style={estilos.nombre}>{perfil.nombre}</Text>
          {perfil.carrera ? <Text style={estilos.suave}>{perfil.carrera}</Text> : null}
          <Text style={estilos.suave}>En UniMarket desde el {formatearFecha(perfil.creadoEn)}</Text>
          <Text style={estilos.subtitulo}>
            {perfil.publicaciones.length === 1 ? '1 publicación activa' : `${perfil.publicaciones.length} publicaciones activas`}
          </Text>
        </View>
      }
      ListEmptyComponent={<EstadoVacio icono="storefront-outline" titulo="No tiene publicaciones activas" />}
    />
  );
}

const estilos = StyleSheet.create({
  cabecera: { alignItems: 'center', padding: 20, gap: 4, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colores.borde },
  avatar: { width: 72, height: 72, borderRadius: 36, backgroundColor: colores.primario, alignItems: 'center', justifyContent: 'center' },
  inicial: { color: '#fff', fontWeight: '800', fontSize: 30 },
  nombre: { fontSize: 20, fontWeight: '700', color: colores.texto, marginTop: 6 },
  suave: { color: colores.textoSuave },
  subtitulo: { fontWeight: '700', color: colores.texto, marginTop: 10 },
});
