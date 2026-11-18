import { Ionicons } from '@expo/vector-icons';
import { Link } from 'expo-router';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Boton } from '../../components/Formulario';
import useSesion from '../../hooks/useSesion';
import { colores } from '../../tema';

// Mi cuenta: datos de la sesión y acceso a lo que en la web está en el menú de la cuenta.
export default function Cuenta() {
  const { usuario, salir } = useSesion();

  const confirmarSalida = () =>
    Alert.alert('Cerrar sesión', '¿Quieres salir de tu cuenta?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Salir', style: 'destructive', onPress: salir },
    ]);

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colores.fondoSuave }} contentContainerStyle={{ padding: 16, gap: 16 }}>
      <View style={estilos.tarjeta}>
        <View style={estilos.avatar}>
          <Text style={estilos.inicial}>{usuario.nombre.charAt(0).toUpperCase()}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={estilos.nombre}>{usuario.nombre}</Text>
          <Text style={estilos.suave}>{usuario.correo}</Text>
          {usuario.carrera ? <Text style={estilos.suave}>{usuario.carrera}</Text> : null}
        </View>
      </View>

      <View style={estilos.lista}>
        <Opcion href="/mis-publicaciones" icono="storefront-outline" texto="Mis publicaciones" />
        <Opcion href="/pedidos?rol=comprador" icono="bag-check-outline" texto="Mis compras" />
        <Opcion href="/pedidos?rol=vendedor" icono="cash-outline" texto="Mis ventas" />
        <Opcion href="/favoritos" icono="heart-outline" texto="Favoritos" />
        <Opcion href={`/usuarios/${usuario.id}`} icono="person-outline" texto="Mi perfil público" ultima />
      </View>

      <Boton texto="Cerrar sesión" variante="peligro" icono="log-out-outline" alTocar={confirmarSalida} />
    </ScrollView>
  );
}

function Opcion({ href, icono, texto, ultima }) {
  return (
    <Link href={href} asChild>
      {/* Dentro de Link asChild el estilo tiene que ser un solo objeto, no una lista */}
      <Pressable style={StyleSheet.flatten([estilos.opcion, !ultima && estilos.separador])} accessibilityRole="link">
        <Ionicons name={icono} size={22} color={colores.primario} />
        <Text style={estilos.textoOpcion}>{texto}</Text>
        <Ionicons name="chevron-forward" size={18} color={colores.textoSuave} />
      </Pressable>
    </Link>
  );
}

const estilos = StyleSheet.create({
  tarjeta: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: colores.fondo, borderRadius: 12, padding: 16 },
  avatar: { width: 56, height: 56, borderRadius: 28, backgroundColor: colores.primario, alignItems: 'center', justifyContent: 'center' },
  inicial: { color: '#fff', fontWeight: '800', fontSize: 24 },
  nombre: { fontSize: 18, fontWeight: '700', color: colores.texto },
  suave: { color: colores.textoSuave },
  lista: { backgroundColor: colores.fondo, borderRadius: 12, overflow: 'hidden' },
  opcion: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16 },
  separador: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colores.borde },
  textoOpcion: { flex: 1, fontSize: 16, color: colores.texto },
});
