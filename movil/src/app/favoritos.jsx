import { FlatList, RefreshControl, View } from 'react-native';
import { Cargando, EstadoVacio, MensajeError } from '../components/Estados';
import TarjetaProducto from '../components/TarjetaProducto';
import usePeticion from '../hooks/usePeticion';
import useRecargarAlVolver from '../hooks/useRecargarAlVolver';
import { listarFavoritos } from '../services/servicios';
import { colores } from '../tema';

// Mis favoritos (GET /favoritos): los mismos que en la web, porque viven en la base de datos.
export default function Favoritos() {
  const { datos, cargando, error, recargar } = usePeticion(listarFavoritos);
  useRecargarAlVolver(recargar);

  if (error) return <MensajeError error={error} alReintentar={recargar} />;
  if (!datos) return <Cargando texto="Cargando favoritos…" />;

  return (
    <View style={{ flex: 1, backgroundColor: colores.fondo }}>
      <FlatList
        data={datos}
        keyExtractor={(producto) => String(producto.id)}
        renderItem={({ item }) => <TarjetaProducto producto={item} />}
        refreshControl={<RefreshControl refreshing={cargando} onRefresh={recargar} />}
        ListEmptyComponent={
          <EstadoVacio icono="heart-outline" titulo="Aún no tienes favoritos" texto="Abre un producto y toca «Guardar en favoritos»." />
        }
        contentContainerStyle={datos.length === 0 && { flexGrow: 1 }}
      />
    </View>
  );
}
