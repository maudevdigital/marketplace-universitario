import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colores } from '../tema';

// Botones − y + para elegir cuántas unidades (en el detalle del producto y en el carrito).
// No deja bajar de 1 ni pasar del stock; igual el backend lo vuelve a validar.
export default function SelectorCantidad({ valor, maximo, alCambiar, deshabilitado = false }) {
  const puedeBajar = !deshabilitado && valor > 1;
  const puedeSubir = !deshabilitado && valor < maximo;
  return (
    <View style={estilos.selector}>
      <Pressable onPress={() => alCambiar(valor - 1)} disabled={!puedeBajar} style={estilos.boton}
        accessibilityRole="button" accessibilityLabel="Una unidad menos">
        <Ionicons name="remove" size={20} color={puedeBajar ? colores.primario : colores.borde} />
      </Pressable>
      <Text style={estilos.cantidad} accessibilityLabel={`${valor} unidades`}>{valor}</Text>
      <Pressable onPress={() => alCambiar(valor + 1)} disabled={!puedeSubir} style={estilos.boton}
        accessibilityRole="button" accessibilityLabel="Una unidad más">
        <Ionicons name="add" size={20} color={puedeSubir ? colores.primario : colores.borde} />
      </Pressable>
    </View>
  );
}

const estilos = StyleSheet.create({
  selector: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: colores.borde, borderRadius: 8 },
  boton: { paddingHorizontal: 10, paddingVertical: 10 },
  cantidad: { minWidth: 28, textAlign: 'center', fontSize: 16, fontWeight: '700', color: colores.texto },
});
