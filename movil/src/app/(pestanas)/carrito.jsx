import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { Cargando, EstadoVacio, MensajeError } from '../../components/Estados';
import { Boton } from '../../components/Formulario';
import FotoProducto from '../../components/FotoProducto';
import SelectorCantidad from '../../components/SelectorCantidad';
import useContadores from '../../hooks/useContadores';
import usePeticion from '../../hooks/usePeticion';
import useRecargarAlVolver from '../../hooks/useRecargarAlVolver';
import { cambiarCantidad, comprarCarrito, obtenerCarrito, quitarDelCarrito, vaciarCarrito } from '../../services/servicios';
import { colores, formatearPrecio } from '../../tema';

// Carrito (GET /carrito): cantidades, total y «Comprar», que crea un pedido por vendedor
// en una sola transacción (POST /pedidos). Si un producto se agotó o se pausó, el backend
// lo marca con «problema» y no deja comprar hasta resolverlo.
export default function Carrito() {
  const { actualizar } = useContadores();
  const { datos: carrito, cargando, error, recargar, setDatos } = usePeticion(obtenerCarrito);
  const [ocupado, setOcupado] = useState(null); // id del producto que se está cambiando, o 'comprar'
  useRecargarAlVolver(recargar);

  // Toda acción devuelve el carrito actualizado: se reemplaza sin volver a pedirlo.
  const ejecutar = async (clave, accion) => {
    setOcupado(clave);
    try {
      setDatos(await accion());
      actualizar();
    } catch (e) {
      Alert.alert('No se pudo', e.message);
      recargar();
    } finally {
      setOcupado(null);
    }
  };

  const comprar = async () => {
    setOcupado('comprar');
    try {
      const pedidos = await comprarCarrito();
      actualizar();
      recargar();
      Alert.alert(
        pedidos.length === 1 ? 'Pedido creado' : `${pedidos.length} pedidos creados`,
        'Ahora paga cada pedido desde su detalle con la tarjeta de prueba.',
      );
      router.push(pedidos.length === 1 ? `/pedidos/${pedidos[0].id}` : '/pedidos');
    } catch (e) {
      Alert.alert('No se pudo comprar', e.message); // por ejemplo, 409 si alguien compró antes la última unidad
      recargar();
    } finally {
      setOcupado(null);
    }
  };

  const confirmarVaciar = () =>
    Alert.alert('Vaciar el carrito', '¿Quitar todos los productos?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Vaciar', style: 'destructive', onPress: () => ejecutar('vaciar', vaciarCarrito) },
    ]);

  if (error) return <MensajeError error={error} alReintentar={recargar} />;
  if (!carrito) return <Cargando texto="Cargando tu carrito…" />;

  return (
    <View style={estilos.pantalla}>
      <FlatList
        data={carrito.items}
        keyExtractor={(item) => String(item.producto.id)}
        refreshControl={<RefreshControl refreshing={cargando} onRefresh={recargar} />}
        renderItem={({ item }) => (
          <ItemCarrito
            item={item}
            ocupado={ocupado === item.producto.id}
            alCambiar={(cantidad) => ejecutar(item.producto.id, () => cambiarCantidad(item.producto.id, cantidad))}
            alQuitar={() => ejecutar(item.producto.id, () => quitarDelCarrito(item.producto.id))}
          />
        )}
        ListEmptyComponent={
          <EstadoVacio icono="cart-outline" titulo="Tu carrito está vacío" texto="Agrega productos desde el catálogo." />
        }
        contentContainerStyle={carrito.items.length === 0 && { flexGrow: 1 }}
      />

      {carrito.items.length > 0 && (
        <View style={estilos.resumen}>
          <View style={estilos.fila}>
            <Text style={estilos.suave}>{carrito.unidades === 1 ? '1 unidad' : `${carrito.unidades} unidades`}</Text>
            <Text style={estilos.total}>{formatearPrecio(carrito.total)}</Text>
          </View>
          {carrito.pedidosAGenerar > 1 && (
            <Text style={estilos.suave}>Se crearán {carrito.pedidosAGenerar} pedidos, uno por vendedor.</Text>
          )}
          {!carrito.sePuedeComprar && (
            <Text style={{ color: colores.peligro }}>Revisa los productos marcados antes de comprar.</Text>
          )}
          <Boton texto="Comprar" icono="bag-check-outline" alTocar={comprar} ocupado={ocupado === 'comprar'}
            deshabilitado={!carrito.sePuedeComprar || ocupado !== null} />
          <Boton texto="Vaciar carrito" variante="peligro" alTocar={confirmarVaciar} deshabilitado={ocupado !== null} />
        </View>
      )}
    </View>
  );
}

function ItemCarrito({ item, ocupado, alCambiar, alQuitar }) {
  const { producto, cantidad, subtotal, problema } = item;
  return (
    <View style={[estilos.item, problema && { backgroundColor: '#fffbeb' }]}>
      <FotoProducto ruta={producto.imagen} style={estilos.foto} />
      <View style={{ flex: 1, gap: 4 }}>
        <Text style={estilos.titulo} numberOfLines={2}>{producto.titulo}</Text>
        <Text style={estilos.suave}>{formatearPrecio(producto.precio)} · {producto.vendedor.nombre}</Text>
        {problema ? <Text style={{ color: colores.peligro, fontSize: 13 }}>{problema}</Text> : null}
        <View style={estilos.fila}>
          <SelectorCantidad valor={cantidad} maximo={Math.max(producto.stock, 1)} alCambiar={alCambiar}
            deshabilitado={ocupado || producto.estado !== 'activo'} />
          <Text style={estilos.subtotal}>{formatearPrecio(subtotal)}</Text>
        </View>
        <Text style={estilos.quitar} onPress={ocupado ? undefined : alQuitar} accessibilityRole="button">
          Quitar
        </Text>
      </View>
    </View>
  );
}

const estilos = StyleSheet.create({
  pantalla: { flex: 1, backgroundColor: colores.fondo },
  item: { flexDirection: 'row', gap: 12, padding: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colores.borde },
  foto: { width: 72, height: 72, borderRadius: 8 },
  titulo: { fontWeight: '600', color: colores.texto },
  suave: { color: colores.textoSuave, fontSize: 13 },
  fila: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  subtotal: { fontWeight: '700', color: colores.texto },
  quitar: { color: colores.peligro, fontSize: 13, alignSelf: 'flex-start', paddingVertical: 4 },
  resumen: { padding: 16, gap: 10, borderTopWidth: 1, borderTopColor: colores.borde, backgroundColor: colores.fondoSuave },
  total: { fontSize: 22, fontWeight: '800', color: colores.primarioOscuro },
});
