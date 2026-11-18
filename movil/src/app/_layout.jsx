import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Cargando } from '../components/Estados';
import { ContadoresProvider } from '../context/ContadoresContext';
import { SesionProvider } from '../context/SesionContext';
import useSesion from '../hooks/useSesion';
import { colores } from '../tema';

// Sin sesión solo existen «Ingresar» y «Crear cuenta»; con sesión, las pestañas y el resto.
// Stack.Protected hace el cambio solo: al ingresar o salir, la aplicación muestra lo que corresponde.
function Navegacion() {
  const { usuario, cargando } = useSesion();
  if (cargando) return <Cargando texto="Revisando tu sesión…" />;

  return (
    // key: al cambiar de cuenta, los números del carrito y de mensajes parten de cero.
    <ContadoresProvider key={usuario?.id ?? 'sin-sesion'} activo={Boolean(usuario)}>
      {/* El fondo de la barra es necesario: en iOS 26, sin color, la barra queda transparente («vidrio»)
          y el contenido de la pantalla empieza debajo de ella, tapando el primer elemento. */}
      <Stack
        screenOptions={{
          headerTintColor: colores.primario,
          headerBackTitle: 'Volver',
          headerStyle: { backgroundColor: colores.fondo },
          headerTitleStyle: { color: colores.texto },
        }}
      >
        <Stack.Protected guard={Boolean(usuario)}>
          <Stack.Screen name="(pestanas)" options={{ headerShown: false }} />
          <Stack.Screen name="productos/[id]/index" options={{ title: 'Producto' }} />
          <Stack.Screen name="productos/[id]/editar" options={{ title: 'Editar publicación' }} />
          <Stack.Screen name="usuarios/[id]" options={{ title: 'Vendedor' }} />
          <Stack.Screen name="mensajes/[id]" options={{ title: 'Conversación' }} />
          <Stack.Screen name="pedidos/index" options={{ title: 'Pedidos' }} />
          <Stack.Screen name="pedidos/[id]" options={{ title: 'Pedido' }} />
          <Stack.Screen name="favoritos" options={{ title: 'Favoritos' }} />
          <Stack.Screen name="mis-publicaciones" options={{ title: 'Mis publicaciones' }} />
        </Stack.Protected>
        <Stack.Protected guard={!usuario}>
          <Stack.Screen name="ingresar" options={{ headerShown: false }} />
          <Stack.Screen name="registro" options={{ title: 'Crear cuenta' }} />
        </Stack.Protected>
      </Stack>
    </ContadoresProvider>
  );
}

export default function RaizLayout() {
  return (
    <SesionProvider>
      <StatusBar style="dark" />
      <Navegacion />
    </SesionProvider>
  );
}
