import { Link, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { Cargando, EstadoVacio, MensajeError } from '../../components/Estados';
import EstadoPedido from '../../components/EstadoPedido';
import usePeticion from '../../hooks/usePeticion';
import useRecargarAlVolver from '../../hooks/useRecargarAlVolver';
import { listarPedidos } from '../../services/servicios';
import { colores, formatearFecha, formatearPrecio } from '../../tema';

const VISTAS = [
  { rol: 'comprador', texto: 'Mis compras' },
  { rol: 'vendedor', texto: 'Mis ventas' },
];

// Pedidos (GET /pedidos?rol=…): lo que compré y lo que vendí, con su estado.
// Se abre desde «Cuenta» con ?rol=comprador o ?rol=vendedor, y se puede cambiar arriba.
export default function Pedidos() {
  const parametros = useLocalSearchParams();
  const [rol, setRol] = useState(parametros.rol === 'vendedor' ? 'vendedor' : 'comprador');
  const { datos, cargando, error, recargar } = usePeticion(() => listarPedidos(rol), [rol]);
  useRecargarAlVolver(recargar);

  return (
    <View style={estilos.pantalla}>
      <View style={estilos.selector} accessibilityRole="tablist">
        {VISTAS.map((vista) => {
          const activa = vista.rol === rol;
          return (
            <Pressable key={vista.rol} onPress={() => setRol(vista.rol)} style={[estilos.opcion, activa && estilos.opcionActiva]}
              accessibilityRole="tab" accessibilityState={{ selected: activa }}>
              <Text style={[estilos.textoOpcion, activa && estilos.textoActivo]}>{vista.texto}</Text>
            </Pressable>
          );
        })}
      </View>

      {error ? (
        <MensajeError error={error} alReintentar={recargar} />
      ) : !datos ? (
        <Cargando texto="Cargando pedidos…" />
      ) : (
        <FlatList
          data={datos}
          keyExtractor={(pedido) => String(pedido.id)}
          renderItem={({ item }) => <FilaPedido pedido={item} rol={rol} />}
          refreshControl={<RefreshControl refreshing={cargando} onRefresh={recargar} />}
          ListEmptyComponent={
            <EstadoVacio
              icono="receipt-outline"
              titulo={rol === 'comprador' ? 'Todavía no has comprado nada' : 'Todavía no tienes ventas'}
            />
          }
          contentContainerStyle={datos.length === 0 && { flexGrow: 1 }}
        />
      )}
    </View>
  );
}

function FilaPedido({ pedido, rol }) {
  const otraPersona = rol === 'comprador' ? `Vende ${pedido.vendedor.nombre}` : `Compra ${pedido.comprador.nombre}`;
  const productos = pedido.detalles.map((detalle) => detalle.producto.titulo).join(', ');
  return (
    <Link href={`/pedidos/${pedido.id}`} asChild>
      <Pressable style={estilos.fila} accessibilityRole="button" accessibilityLabel={`Pedido ${pedido.id}`}>
        <View style={estilos.cabecera}>
          <Text style={estilos.numero}>Pedido #{pedido.id}</Text>
          <EstadoPedido estado={pedido.estado} />
        </View>
        <Text style={estilos.productos} numberOfLines={2}>{productos}</Text>
        <View style={estilos.cabecera}>
          <Text style={estilos.suave}>{otraPersona} · {formatearFecha(pedido.creadoEn)}</Text>
          <Text style={estilos.total}>{formatearPrecio(pedido.total)}</Text>
        </View>
      </Pressable>
    </Link>
  );
}

const estilos = StyleSheet.create({
  pantalla: { flex: 1, backgroundColor: colores.fondo },
  selector: { flexDirection: 'row', margin: 12, borderRadius: 10, backgroundColor: colores.fondoSuave, padding: 4 },
  opcion: { flex: 1, padding: 8, borderRadius: 8, alignItems: 'center' },
  opcionActiva: { backgroundColor: colores.fondo, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 3, elevation: 1 },
  textoOpcion: { color: colores.textoSuave, fontWeight: '600' },
  textoActivo: { color: colores.primario },
  fila: { padding: 14, gap: 6, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colores.borde },
  cabecera: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  numero: { fontWeight: '700', color: colores.texto },
  productos: { color: colores.texto },
  suave: { color: colores.textoSuave, fontSize: 13, flexShrink: 1 },
  total: { fontWeight: '700', color: colores.texto },
});
