import { Link } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colores, formatearPrecio } from '../tema';
import FotoProducto from './FotoProducto';

// Una fila del catálogo o de favoritos. Al tocarla abre el detalle del producto.
export default function TarjetaProducto({ producto }) {
  const noDisponible = producto.estado !== 'activo';
  return (
    <Link href={`/productos/${producto.id}`} asChild>
      <Pressable style={estilos.tarjeta} accessibilityRole="button" accessibilityLabel={producto.titulo}>
        <FotoProducto ruta={producto.imagen} style={estilos.foto} />
        <View style={estilos.texto}>
          <Text style={estilos.titulo} numberOfLines={2}>{producto.titulo}</Text>
          <Text style={estilos.precio}>{formatearPrecio(producto.precio)}</Text>
          <Text style={estilos.detalle} numberOfLines={1}>
            {producto.categoria?.nombre} · {producto.vendedor?.nombre}
          </Text>
          {noDisponible && <Text style={estilos.aviso}>No disponible ({producto.estado})</Text>}
        </View>
      </Pressable>
    </Link>
  );
}

const estilos = StyleSheet.create({
  tarjeta: {
    flexDirection: 'row',
    gap: 12,
    padding: 12,
    backgroundColor: colores.fondo,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colores.borde,
  },
  foto: { width: 84, height: 84, borderRadius: 8 },
  texto: { flex: 1, gap: 2 },
  titulo: { fontSize: 15, fontWeight: '600', color: colores.texto },
  precio: { fontSize: 16, fontWeight: '700', color: colores.primarioOscuro },
  detalle: { fontSize: 13, color: colores.textoSuave },
  aviso: { fontSize: 12, color: colores.aviso, fontWeight: '600' },
});
