import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import useContadores from '../../hooks/useContadores';
import { colores } from '../../tema';

// Las pestañas de la aplicación. Favoritos, pedidos, ventas y mis publicaciones se abren desde «Cuenta».
export default function Pestanas() {
  const { unidadesCarrito, noLeidos } = useContadores();
  const insignia = (numero) => (numero > 0 ? (numero > 99 ? '99+' : numero) : undefined);

  // En los iPhone sin botón, iOS reserva abajo la zona de la barra de inicio (unos 34 puntos) y la
  // barra de pestañas se veía con una franja vacía. Se usa solo una parte de esa zona: las pestañas
  // quedan más abajo, pero sin tocar la rayita que se desliza para salir de la app.
  const { bottom } = useSafeAreaInsets();
  const espacioInferior = bottom > 0 ? Math.max(bottom - 16, 10) : 8;

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colores.primario,
        headerTitleStyle: { color: colores.texto },
        tabBarStyle: { height: 58 + espacioInferior, paddingTop: 6, paddingBottom: espacioInferior },
        tabBarLabelStyle: { fontSize: 12 },
        tabBarIconStyle: { marginBottom: 2 },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Catálogo', tabBarIcon: icono('grid-outline') }} />
      <Tabs.Screen
        name="carrito"
        options={{ title: 'Carrito', tabBarIcon: icono('cart-outline'), tabBarBadge: insignia(unidadesCarrito) }}
      />
      <Tabs.Screen name="publicar" options={{ title: 'Publicar', tabBarIcon: icono('add-circle-outline') }} />
      <Tabs.Screen
        name="mensajes"
        options={{ title: 'Mensajes', tabBarIcon: icono('chatbubbles-outline'), tabBarBadge: insignia(noLeidos) }}
      />
      <Tabs.Screen name="cuenta" options={{ title: 'Cuenta', tabBarIcon: icono('person-circle-outline') }} />
    </Tabs>
  );
}

const icono = (nombre) =>
  function IconoPestana({ color, size }) {
    return <Ionicons name={nombre} color={color} size={size} />;
  };
