import { Link } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import useSesion from '../hooks/useSesion';
import { colores } from '../tema';

const CORREO_VALIDO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Inicio de sesión con las mismas cuentas de la web (POST /auth/ingreso).
export default function Ingresar() {
  const { ingresar } = useSesion();
  const [correo, setCorreo] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [errores, setErrores] = useState({});
  const [errorGeneral, setErrorGeneral] = useState('');
  const [enviando, setEnviando] = useState(false);

  const enviar = async () => {
    const encontrados = {};
    if (!CORREO_VALIDO.test(correo.trim())) encontrados.correo = 'Escribe un correo válido.';
    if (!contrasena) encontrados.contrasena = 'Escribe tu contraseña.';
    setErrores(encontrados);
    setErrorGeneral('');
    if (Object.keys(encontrados).length > 0) return;

    setEnviando(true);
    try {
      await ingresar(correo.trim().toLowerCase(), contrasena);
      // No hace falta navegar: al haber sesión, el layout muestra las pestañas.
    } catch (error) {
      setErrorGeneral(error.message);
      setEnviando(false);
    }
  };

  return (
    <SafeAreaView style={estilos.pantalla}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={estilos.contenido} keyboardShouldPersistTaps="handled">
          <Text style={estilos.marca}>UniMarket</Text>
          <Text style={estilos.subtitulo}>Compra y vende entre estudiantes</Text>

          {errorGeneral ? (
            <View style={estilos.alerta} accessibilityRole="alert">
              <Text style={estilos.textoAlerta}>{errorGeneral}</Text>
            </View>
          ) : null}

          <Text style={estilos.etiqueta}>Correo</Text>
          <TextInput
            style={[estilos.campo, errores.correo && estilos.campoInvalido]}
            value={correo}
            onChangeText={setCorreo}
            placeholder="tu.nombre@alumnos.cl"
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            textContentType="emailAddress"
          />
          {errores.correo && <Text style={estilos.error}>{errores.correo}</Text>}

          <Text style={estilos.etiqueta}>Contraseña</Text>
          <TextInput
            style={[estilos.campo, errores.contrasena && estilos.campoInvalido]}
            value={contrasena}
            onChangeText={setContrasena}
            secureTextEntry
            autoComplete="password"
            textContentType="password"
            onSubmitEditing={enviar}
          />
          {errores.contrasena && <Text style={estilos.error}>{errores.contrasena}</Text>}

          <Pressable
            style={[estilos.boton, enviando && { opacity: 0.6 }]}
            onPress={enviar}
            disabled={enviando}
            accessibilityRole="button"
          >
            {enviando ? <ActivityIndicator color="#fff" /> : <Text style={estilos.textoBoton}>Ingresar</Text>}
          </Pressable>

          <Link href="/registro" asChild>
            <Pressable style={estilos.enlace} accessibilityRole="link">
              <Text style={estilos.nota}>
                ¿No tienes cuenta? <Text style={estilos.textoEnlace}>Crear una</Text>
              </Text>
            </Pressable>
          </Link>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const estilos = StyleSheet.create({
  pantalla: { flex: 1, backgroundColor: colores.fondo },
  contenido: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  marca: { fontSize: 34, fontWeight: '800', color: colores.primario, textAlign: 'center' },
  subtitulo: { color: colores.textoSuave, textAlign: 'center', marginBottom: 28 },
  alerta: { backgroundColor: '#fef2f2', borderColor: colores.peligro, borderWidth: 1, borderRadius: 8, padding: 12, marginBottom: 12 },
  textoAlerta: { color: colores.peligro },
  etiqueta: { fontWeight: '600', color: colores.texto, marginTop: 12, marginBottom: 6 },
  campo: { borderWidth: 1, borderColor: colores.borde, borderRadius: 8, padding: 12, fontSize: 16, color: colores.texto },
  campoInvalido: { borderColor: colores.peligro },
  error: { color: colores.peligro, marginTop: 4, fontSize: 13 },
  boton: { backgroundColor: colores.primario, borderRadius: 8, padding: 14, alignItems: 'center', marginTop: 24 },
  textoBoton: { color: '#fff', fontWeight: '700', fontSize: 16 },
  enlace: { marginTop: 20, padding: 8 },
  nota: { color: colores.textoSuave, textAlign: 'center', fontSize: 14 },
  textoEnlace: { color: colores.primario, fontWeight: '700' },
});
