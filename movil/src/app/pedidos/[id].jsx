import { Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Cargando, MensajeError } from '../../components/Estados';
import EstadoPedido from '../../components/EstadoPedido';
import FormularioPago from '../../components/FormularioPago';
import { Boton } from '../../components/Formulario';
import FotoProducto from '../../components/FotoProducto';
import usePeticion from '../../hooks/usePeticion';
import { cancelarPedido, marcarEntregado, obtenerPedido, pagarPedido } from '../../services/servicios';
import { colores, formatearFecha, formatearPrecio } from '../../tema';

// Detalle de un pedido (GET /pedidos/:id) con las mismas acciones que la web:
//   comprador: pagar si está pendiente · vendedor: marcar entregado si está pagado
//   cualquiera de los dos: cancelar si está pendiente o pagado (las unidades vuelven al stock)
export default function DetallePedido() {
  const { id } = useLocalSearchParams();
  const { datos: pedido, error, recargar, setDatos } = usePeticion(() => obtenerPedido(id), [id]);
  const [ocupado, setOcupado] = useState(false);

  if (error) {
    // 403: no participa en el pedido · 404: no existe. Reintentar no cambia nada en esos casos.
    return <MensajeError error={error} alReintentar={[403, 404].includes(error.estado) ? undefined : recargar} />;
  }
  if (!pedido) return <Cargando />;

  const soyComprador = pedido.miRol === 'comprador';
  const puedePagar = soyComprador && pedido.estado === 'pendiente';
  const puedeEntregar = !soyComprador && pedido.estado === 'pagado';
  const puedeCancelar = ['pendiente', 'pagado'].includes(pedido.estado);
  const pagoAprobado = pedido.pagos?.find((pago) => pago.estado === 'aprobado');

  // Cada acción devuelve el pedido actualizado (con miRol): se reemplaza sin volver a pedirlo.
  const ejecutar = async (accion, mensaje) => {
    setOcupado(true);
    try {
      setDatos(await accion());
      Alert.alert('Listo', mensaje);
    } catch (e) {
      Alert.alert('No se pudo', e.message);
      recargar();
    } finally {
      setOcupado(false);
    }
  };

  // Un pago rechazado (402) también queda registrado: se recarga para mostrarlo.
  const pagar = async (datos) => {
    try {
      setDatos(await pagarPedido(pedido.id, datos));
      Alert.alert('Pago aprobado', 'Coordina la entrega con el vendedor por mensajes.');
    } catch (e) {
      if (e.estado === 402) recargar();
      throw e; // el formulario muestra el mensaje
    }
  };

  const confirmarCancelacion = () =>
    Alert.alert(
      `Cancelar el pedido #${pedido.id}`,
      `Las unidades vuelven a estar disponibles.${pedido.estado === 'pagado' ? ' El pago simulado se considera devuelto.' : ''}`,
      [
        { text: 'No', style: 'cancel' },
        { text: 'Cancelar pedido', style: 'destructive', onPress: () => ejecutar(() => cancelarPedido(pedido.id), 'El pedido quedó cancelado.') },
      ],
    );

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }} keyboardVerticalOffset={90}>
      <ScrollView style={estilos.pantalla} contentContainerStyle={{ padding: 16, gap: 14, paddingBottom: 40 }}
        keyboardShouldPersistTaps="handled">
        <Stack.Screen options={{ title: `Pedido #${pedido.id}` }} />

        <View style={estilos.cabecera}>
          <EstadoPedido estado={pedido.estado} />
          <Text style={estilos.suave}>Creado el {formatearFecha(pedido.creadoEn)}</Text>
        </View>

        <View style={estilos.caja}>
          <Text style={estilos.dato}>Comprador: {pedido.comprador.nombre}</Text>
          <Text style={estilos.dato}>Vendedor: {pedido.vendedor.nombre}</Text>
          <Text style={estilos.suave}>Última actualización: {formatearFecha(pedido.actualizadoEn)}</Text>
        </View>

        <Text style={estilos.subtitulo}>Productos</Text>
        {pedido.detalles.map((detalle) => (
          <View key={detalle.id} style={estilos.detalle}>
            <FotoProducto ruta={detalle.producto.imagen} style={estilos.foto} />
            <View style={{ flex: 1 }}>
              <Text style={estilos.dato} numberOfLines={2}>{detalle.producto.titulo}</Text>
              <Text style={estilos.suave}>{detalle.cantidad} × {formatearPrecio(detalle.precioUnitario)}</Text>
            </View>
            <Text style={estilos.dato}>{formatearPrecio(detalle.subtotal)}</Text>
          </View>
        ))}

        <View style={[estilos.cabecera, estilos.lineaTotal]}>
          <Text style={estilos.subtitulo}>Total</Text>
          <Text style={estilos.total}>{formatearPrecio(pedido.total)}</Text>
        </View>

        {pagoAprobado && (
          <View style={estilos.caja}>
            <Text style={estilos.subtitulo}>Pago simulado aprobado</Text>
            <Text style={estilos.dato}>Comprobante: {pagoAprobado.comprobante}</Text>
            <Text style={estilos.suave}>{formatearFecha(pagoAprobado.creadoEn)}</Text>
          </View>
        )}

        {puedePagar && <FormularioPago total={formatearPrecio(pedido.total)} alPagar={pagar} />}
        {soyComprador && pedido.estado === 'pagado' && (
          <Text style={estilos.suave}>Ya pagaste. Coordina la entrega con el vendedor; él la marcará cuando te lo entregue.</Text>
        )}
        {!soyComprador && pedido.estado === 'pendiente' && (
          <Text style={estilos.suave}>Esperando el pago del comprador. Cuando pague podrás marcar la entrega.</Text>
        )}
        {puedeEntregar && (
          <Boton texto="Marcar como entregado" variante="exito" icono="checkmark-done-outline" ocupado={ocupado}
            alTocar={() => ejecutar(() => marcarEntregado(pedido.id), 'Marcaste el pedido como entregado.')} />
        )}
        {puedeCancelar && (
          <Boton texto="Cancelar pedido" variante="peligro" alTocar={confirmarCancelacion} deshabilitado={ocupado} />
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const estilos = StyleSheet.create({
  pantalla: { flex: 1, backgroundColor: colores.fondo },
  cabecera: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  caja: { backgroundColor: colores.fondoSuave, borderRadius: 10, padding: 12, gap: 4 },
  subtitulo: { fontSize: 16, fontWeight: '700', color: colores.texto },
  detalle: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  foto: { width: 52, height: 52, borderRadius: 6 },
  dato: { color: colores.texto },
  suave: { color: colores.textoSuave, fontSize: 13 },
  lineaTotal: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colores.borde, paddingTop: 12 },
  total: { fontSize: 20, fontWeight: '800', color: colores.primarioOscuro },
});
