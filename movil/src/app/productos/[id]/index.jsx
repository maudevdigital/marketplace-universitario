import { Ionicons } from '@expo/vector-icons';
import { Link, router, Stack, useLocalSearchParams } from 'expo-router';
import { useRef, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Cargando, MensajeError } from '../../../components/Estados';
import { Boton, Entrada } from '../../../components/Formulario';
import FotoProducto from '../../../components/FotoProducto';
import SelectorCantidad from '../../../components/SelectorCantidad';
import useContadores from '../../../hooks/useContadores';
import usePeticion from '../../../hooks/usePeticion';
import useSesion from '../../../hooks/useSesion';
import {
  agregarAlCarrito,
  listarFavoritos,
  marcarFavorito,
  obtenerProducto,
  preguntarPorProducto,
  quitarFavorito,
} from '../../../services/servicios';
import { CONDICIONES, colores, formatearPrecio } from '../../../tema';

// Detalle de un producto (GET /productos/:id): favorito, carrito y pregunta al vendedor.
// Si el producto es mío, en vez de eso aparece «Editar».
export default function DetalleProducto() {
  const { id } = useLocalSearchParams();
  const { usuario } = useSesion();
  const { datos: producto, error, recargar } = usePeticion(() => obtenerProducto(id), [id]);
  const pantalla = useRef(null);

  // La pregunta al vendedor está al final: al tocarla, el teclado la tapaba. Se baja hasta ella
  // cuando el teclado ya terminó de subir.
  const mostrarPregunta = () => setTimeout(() => pantalla.current?.scrollToEnd({ animated: true }), 300);

  if (error) return <MensajeError error={error} alReintentar={error.estado === 404 ? undefined : recargar} />;
  if (!producto) return <Cargando />;

  const esMio = usuario.id === producto.vendedor.id;
  const disponible = producto.estado === 'activo';
  const condicion = CONDICIONES.find((c) => c.valor === producto.condicion)?.texto;

  return (
    <ScrollView
      ref={pantalla}
      style={estilos.pantalla}
      contentContainerStyle={{ paddingBottom: 40 }}
      keyboardShouldPersistTaps="handled"
      automaticallyAdjustKeyboardInsets // deja espacio bajo el contenido mientras el teclado está abierto
      keyboardDismissMode="interactive" // arrastrar hacia abajo cierra el teclado
    >
      <Stack.Screen options={{ title: producto.titulo }} />
      <FotoProducto ruta={producto.imagen} style={estilos.foto} />

      <View style={estilos.cuerpo}>
        <Text style={estilos.titulo}>{producto.titulo}</Text>
        <Text style={estilos.precio}>{formatearPrecio(producto.precio)}</Text>

        <View style={estilos.etiquetas}>
          <Etiqueta texto={producto.categoria.nombre} />
          {condicion && <Etiqueta texto={condicion} />}
          {disponible ? (
            <Etiqueta texto={producto.stock === 1 ? 'Queda 1' : `Quedan ${producto.stock}`} />
          ) : (
            <Etiqueta texto={`No disponible (${producto.estado})`} color={colores.aviso} />
          )}
        </View>

        {esMio ? (
          <Boton variante="secundario" icono="create-outline" texto="Editar mi publicación"
            alTocar={() => router.push(`/productos/${producto.id}/editar`)} style={{ marginTop: 12 }} />
        ) : (
          <>
            {disponible && <AgregarAlCarrito producto={producto} />}
            <BotonFavorito producto={producto} />
          </>
        )}

        {(producto.marca || producto.modelo) && (
          <Text style={estilos.dato}>{[producto.marca, producto.modelo].filter(Boolean).join(' · ')}</Text>
        )}

        <Link href={`/usuarios/${producto.vendedor.id}`} asChild>
          <Pressable style={estilos.vendedor} accessibilityRole="link">
            <Ionicons name="person-circle-outline" size={22} color={colores.primario} />
            <Text style={{ color: colores.texto, flex: 1 }}>
              Vende <Text style={{ fontWeight: '700' }}>{producto.vendedor.nombre}</Text>
              {producto.vendedor.carrera ? ` (${producto.vendedor.carrera})` : ''}
            </Text>
            <Ionicons name="chevron-forward" size={18} color={colores.textoSuave} />
          </Pressable>
        </Link>

        <Text style={estilos.subtitulo}>Descripción</Text>
        <Text style={estilos.descripcion}>{producto.descripcion}</Text>

        {!esMio && producto.estado !== 'eliminado' && (
          <PreguntarVendedor producto={producto} alEnfocar={mostrarPregunta} />
        )}
      </View>
    </ScrollView>
  );
}

// Cantidad + «Agregar al carrito» (POST /carrito/items). El backend no deja pasar del stock (409).
function AgregarAlCarrito({ producto }) {
  const { actualizar } = useContadores();
  const [cantidad, setCantidad] = useState(1);
  const [ocupado, setOcupado] = useState(false);
  const [error, setError] = useState('');

  const agregar = async () => {
    setOcupado(true);
    setError('');
    try {
      await agregarAlCarrito(producto.id, cantidad);
      actualizar();
      Alert.alert('Agregado al carrito', cantidad === 1 ? producto.titulo : `${cantidad} unidades de ${producto.titulo}`, [
        { text: 'Seguir mirando', style: 'cancel' },
        { text: 'Ir al carrito', onPress: () => router.push('/carrito') },
      ]);
    } catch (e) {
      setError(e.message);
    } finally {
      setOcupado(false);
    }
  };

  return (
    <View style={{ marginTop: 14, gap: 8 }}>
      <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
        <SelectorCantidad valor={cantidad} maximo={producto.stock} alCambiar={setCantidad} />
        <Boton texto="Agregar al carrito" icono="cart-outline" alTocar={agregar} ocupado={ocupado} style={{ flex: 1 }} />
      </View>
      {error ? <Text style={{ color: colores.peligro }}>{error}</Text> : null}
    </View>
  );
}

// Marca o quita el favorito (POST o DELETE /favoritos/:productoId).
function BotonFavorito({ producto }) {
  const { datos: favoritos } = usePeticion(listarFavoritos);
  const [marcado, setMarcado] = useState(null); // null = todavía según la lista del backend
  const [ocupado, setOcupado] = useState(false);
  const [error, setError] = useState('');

  if (!favoritos) return <ActivityIndicator style={{ alignSelf: 'flex-start', marginVertical: 12 }} />;

  const esFavorito = marcado ?? favoritos.some((favorito) => favorito.id === producto.id);
  const alternar = async () => {
    setOcupado(true);
    setError('');
    try {
      if (esFavorito) await quitarFavorito(producto.id);
      else await marcarFavorito(producto.id);
      setMarcado(!esFavorito);
    } catch (e) {
      setError(e.message);
    } finally {
      setOcupado(false);
    }
  };

  return (
    <View style={{ marginVertical: 10 }}>
      <Boton variante="secundario" icono={esFavorito ? 'heart' : 'heart-outline'}
        texto={esFavorito ? 'Guardado en favoritos' : 'Guardar en favoritos'} alTocar={alternar} ocupado={ocupado} />
      {error ? <Text style={{ color: colores.peligro, marginTop: 6 }}>{error}</Text> : null}
    </View>
  );
}

// Primera pregunta al vendedor (POST /conversaciones). Si ya había una conversación por este
// producto, el backend suma el mensaje a la misma. Después abre la conversación.
function PreguntarVendedor({ producto, alEnfocar }) {
  const { actualizar } = useContadores();
  const [texto, setTexto] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState('');

  const enviar = async () => {
    const limpio = texto.trim();
    if (!limpio) {
      setError('Escribe tu pregunta.');
      return;
    }
    setEnviando(true);
    setError('');
    try {
      const conversacion = await preguntarPorProducto(producto.id, limpio);
      setTexto('');
      actualizar();
      router.push(`/mensajes/${conversacion.id}`);
    } catch (e) {
      setError(e.message);
    } finally {
      setEnviando(false);
    }
  };

  return (
    <View style={estilos.preguntar}>
      <Text style={estilos.subtitulo}>Preguntar a {producto.vendedor.nombre}</Text>
      <Entrada multilinea value={texto} onChangeText={setTexto} maxLength={1000} invalido={error} onFocus={alEnfocar}
        placeholder="¿Sigue disponible? ¿Dónde lo entregas?" style={{ minHeight: 70 }} />
      {error ? <Text style={{ color: colores.peligro }}>{error}</Text> : null}
      <Boton texto="Enviar pregunta" icono="chatbubble-ellipses-outline" alTocar={enviar} ocupado={enviando} />
    </View>
  );
}

function Etiqueta({ texto, color = colores.textoSuave }) {
  return (
    <View style={[estilos.etiqueta, { borderColor: color }]}>
      <Text style={{ color, fontSize: 13 }}>{texto}</Text>
    </View>
  );
}

const estilos = StyleSheet.create({
  pantalla: { flex: 1, backgroundColor: colores.fondo },
  foto: { width: '100%', aspectRatio: 1 },
  cuerpo: { padding: 16, gap: 6 },
  titulo: { fontSize: 22, fontWeight: '700', color: colores.texto },
  precio: { fontSize: 24, fontWeight: '800', color: colores.primarioOscuro },
  etiquetas: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 4 },
  etiqueta: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 10, paddingVertical: 3 },
  dato: { color: colores.texto },
  vendedor: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: colores.borde,
    marginTop: 6,
  },
  subtitulo: { fontSize: 16, fontWeight: '700', color: colores.texto, marginTop: 12 },
  descripcion: { color: colores.texto, lineHeight: 21 },
  preguntar: { gap: 8, marginTop: 8 },
});
