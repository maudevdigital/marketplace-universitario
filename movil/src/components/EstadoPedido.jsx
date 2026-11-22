import { Text, View } from 'react-native';
import { ESTADOS_PEDIDO, ESTADOS_PRODUCTO, colores } from '../tema';

// Etiqueta de color con un texto corto (estado de un pedido o de una publicación).
export function Insignia({ texto, color }) {
  return (
    <View style={{ backgroundColor: color, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 3, alignSelf: 'flex-start' }}>
      <Text style={{ color: '#fff', fontSize: 12, fontWeight: '700' }}>{texto}</Text>
    </View>
  );
}

// Pendiente, pagado, entregado o cancelado.
export default function EstadoPedido({ estado }) {
  const { texto, color } = ESTADOS_PEDIDO[estado] ?? { texto: estado, color: colores.textoSuave };
  return <Insignia texto={texto} color={color} />;
}

// Activa, pausada, agotada o archivada.
export function EstadoProducto({ estado }) {
  const { texto, color } = ESTADOS_PRODUCTO[estado] ?? { texto: estado, color: colores.textoSuave };
  return <Insignia texto={texto} color={color} />;
}
