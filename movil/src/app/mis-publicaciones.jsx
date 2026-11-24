import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { EstadoProducto } from '../components/EstadoPedido';
import { Cargando, EstadoVacio, MensajeError } from '../components/Estados';
import { Boton } from '../components/Formulario';
import FotoProducto from '../components/FotoProducto';
import usePeticion from '../hooks/usePeticion';
import useRecargarAlVolver from '../hooks/useRecargarAlVolver';
import { actualizarProducto, eliminarProducto, listarMisProductos } from '../services/servicios';
import { colores, formatearPrecio } from '../tema';

// Mis publicaciones (GET /productos/mios), en cualquier estado: editar, pausar, reactivar o eliminar.
// Si un producto ya tiene pedidos, el backend no lo borra: lo archiva para no romper esos pedidos.
export default function MisPublicaciones() {
  const { datos, cargando, error, recargar, setDatos } = usePeticion(listarMisProductos);
  const [ocupado, setOcupado] = useState(null);
  useRecargarAlVolver(recargar);

  const cambiarEstado = async (producto, estado) => {
    const datosFormulario = new FormData();
    datosFormulario.append('estado', estado);
    setOcupado(producto.id);
    try {
      const actualizado = await actualizarProducto(producto.id, datosFormulario);
      setDatos((lista) => lista.map((item) => (item.id === producto.id ? actualizado : item)));
    } catch (e) {
      Alert.alert('No se pudo', e.message);
    } finally {
      setOcupado(null);
    }
  };

  const confirmarEliminar = (producto) =>
    Alert.alert('Eliminar publicación', `¿Eliminar «${producto.titulo}»? Esta acción no se puede deshacer.`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          setOcupado(producto.id);
          try {
            const respuesta = await eliminarProducto(producto.id);
            setDatos((lista) => lista.filter((item) => item.id !== producto.id));
            Alert.alert('Listo', respuesta.mensaje);
          } catch (e) {
            Alert.alert('No se pudo', e.message);
          } finally {
            setOcupado(null);
          }
        },
      },
    ]);

  if (error) return <MensajeError error={error} alReintentar={recargar} />;
  if (!datos) return <Cargando texto="Cargando tus publicaciones…" />;

  return (
    <FlatList
      style={{ flex: 1, backgroundColor: colores.fondo }}
      data={datos}
      keyExtractor={(producto) => String(producto.id)}
      refreshControl={<RefreshControl refreshing={cargando} onRefresh={recargar} />}
      renderItem={({ item }) => (
        <View style={estilos.fila}>
          <Pressable style={estilos.cabecera} onPress={() => router.push(`/productos/${item.id}`)} accessibilityRole="button">
            <FotoProducto ruta={item.imagen} style={estilos.foto} />
            <View style={{ flex: 1, gap: 3 }}>
              <Text style={estilos.titulo} numberOfLines={2}>{item.titulo}</Text>
              <Text style={estilos.suave}>{formatearPrecio(item.precio)} · {item.stock} disponibles</Text>
              <EstadoProducto estado={item.estado} />
            </View>
          </Pressable>
          <View style={estilos.acciones}>
            <Boton texto="Editar" variante="secundario" icono="create-outline" style={estilos.accion}
              alTocar={() => router.push(`/productos/${item.id}/editar`)} deshabilitado={ocupado === item.id} />
            {item.estado === 'activo' && (
              <Boton texto="Pausar" variante="secundario" icono="pause-outline" style={estilos.accion}
                alTocar={() => cambiarEstado(item, 'pausado')} ocupado={ocupado === item.id} />
            )}
            {item.estado === 'pausado' && (
              <Boton texto="Reactivar" variante="secundario" icono="play-outline" style={estilos.accion}
                alTocar={() => cambiarEstado(item, 'activo')} ocupado={ocupado === item.id} />
            )}
            <Boton texto="Eliminar" variante="peligro" icono="trash-outline" style={estilos.accion}
              alTocar={() => confirmarEliminar(item)} deshabilitado={ocupado === item.id} />
          </View>
          {item.estado === 'agotado' && <Text style={estilos.suave}>Sin unidades: edita la publicación y súbele el stock.</Text>}
        </View>
      )}
      ListEmptyComponent={
        <EstadoVacio icono="storefront-outline" titulo="Todavía no publicas nada" texto="Usa la pestaña «Publicar»." />
      }
      contentContainerStyle={datos.length === 0 && { flexGrow: 1 }}
    />
  );
}

const estilos = StyleSheet.create({
  fila: { padding: 12, gap: 10, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colores.borde },
  cabecera: { flexDirection: 'row', gap: 12 },
  foto: { width: 72, height: 72, borderRadius: 8 },
  titulo: { fontWeight: '600', color: colores.texto },
  suave: { color: colores.textoSuave, fontSize: 13 },
  acciones: { flexDirection: 'row', gap: 8 },
  accion: { flex: 1, paddingVertical: 8, paddingHorizontal: 6 },
});
