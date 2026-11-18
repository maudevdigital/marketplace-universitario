import { Link, Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Cargando, MensajeError } from '../../components/Estados';
import { Boton, Entrada } from '../../components/Formulario';
import useContadores from '../../hooks/useContadores';
import usePeticion from '../../hooks/usePeticion';
import { obtenerConversacion, responderConversacion } from '../../services/servicios';
import { colores } from '../../tema';
import { formatearMomento } from '../../utils/momento';

const CADA = 10_000; // igual que la web: la conversación abierta se revisa cada 10 segundos

// Una conversación (GET /conversaciones/:id, en MongoDB). Al abrirla, el backend marca como leídos
// los mensajes de la otra persona. Responder: POST /conversaciones/:id/mensajes.
export default function Conversacion() {
  const { id } = useLocalSearchParams();
  const { actualizar } = useContadores();
  const { datos: conversacion, error, recargar, setDatos } = usePeticion(() => obtenerConversacion(id), [id]);
  const [texto, setTexto] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [errorEnvio, setErrorEnvio] = useState('');
  const lista = useRef(null);

  // Revisa si llegaron mensajes nuevos mientras la pantalla está abierta.
  useEffect(() => {
    const intervalo = setInterval(recargar, CADA);
    return () => clearInterval(intervalo);
  }, [recargar]);

  // Al abrirla se leyeron los mensajes: el número rojo de la pestaña tiene que bajar.
  const cantidad = conversacion?.mensajes.length;
  useEffect(() => {
    if (cantidad !== undefined) actualizar();
  }, [cantidad, actualizar]);

  if (error && !conversacion) {
    return <MensajeError error={error} alReintentar={[403, 404].includes(error.estado) ? undefined : recargar} />;
  }
  if (!conversacion) return <Cargando texto="Abriendo la conversación…" />;

  const otraPersona = conversacion.miRol === 'comprador' ? conversacion.vendedor : conversacion.comprador;

  const enviar = async () => {
    const limpio = texto.trim();
    if (!limpio) return;
    setEnviando(true);
    setErrorEnvio('');
    try {
      setDatos(await responderConversacion(conversacion.id, limpio));
      setTexto('');
    } catch (e) {
      setErrorEnvio(e.message);
    } finally {
      setEnviando(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }} keyboardVerticalOffset={90}>
      <Stack.Screen options={{ title: otraPersona.nombre }} />
      <Link href={`/productos/${conversacion.producto.id}`} asChild>
        <Pressable style={estilos.producto} accessibilityRole="link">
          <Text style={estilos.suave} numberOfLines={1}>
            {conversacion.miRol === 'comprador' ? 'Preguntas por' : 'Te preguntan por'}{' '}
            <Text style={{ color: colores.primario, fontWeight: '600' }}>{conversacion.producto.titulo}</Text>
          </Text>
        </Pressable>
      </Link>

      <ScrollView
        ref={lista}
        style={{ flex: 1, backgroundColor: colores.fondoSuave }}
        contentContainerStyle={{ padding: 12, gap: 8 }}
        onContentSizeChange={() => lista.current?.scrollToEnd({ animated: false })}
      >
        {conversacion.mensajes.map((mensaje) => (
          <View key={mensaje.id} style={[estilos.burbuja, mensaje.esMio ? estilos.mia : estilos.ajena]}>
            <Text style={{ color: mensaje.esMio ? '#fff' : colores.texto }}>{mensaje.texto}</Text>
            <Text style={[estilos.hora, { color: mensaje.esMio ? '#e0e7ff' : colores.textoSuave }]}>
              {formatearMomento(mensaje.enviadoEn)}
              {mensaje.esMio ? (mensaje.leido ? ' · Leído' : ' · Enviado') : ''}
            </Text>
          </View>
        ))}
      </ScrollView>

      <View style={estilos.escribir}>
        {errorEnvio ? <Text style={{ color: colores.peligro }}>{errorEnvio}</Text> : null}
        <View style={{ flexDirection: 'row', gap: 8, alignItems: 'flex-end' }}>
          <Entrada value={texto} onChangeText={setTexto} placeholder="Escribe un mensaje" maxLength={1000} multiline
            style={{ flex: 1, maxHeight: 110 }} />
          <Boton texto="Enviar" alTocar={enviar} ocupado={enviando} deshabilitado={!texto.trim()} />
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const estilos = StyleSheet.create({
  producto: { padding: 12, backgroundColor: colores.fondo, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colores.borde },
  suave: { color: colores.textoSuave },
  burbuja: { maxWidth: '80%', borderRadius: 14, paddingHorizontal: 12, paddingVertical: 8, gap: 2 },
  mia: { alignSelf: 'flex-end', backgroundColor: colores.primario },
  ajena: { alignSelf: 'flex-start', backgroundColor: colores.fondo, borderWidth: 1, borderColor: colores.borde },
  hora: { fontSize: 11 },
  escribir: { padding: 10, gap: 6, backgroundColor: colores.fondo, borderTopWidth: 1, borderTopColor: colores.borde },
});
