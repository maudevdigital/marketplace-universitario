import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { Alerta, Boton, Campo, Entrada } from '../components/Formulario';
import useSesion from '../hooks/useSesion';
import { colores } from '../tema';

// Mismas reglas que la página de registro web y que RegistroDto del backend.
function validar({ nombre, correo, contrasena, confirmacion }) {
  const errores = {};
  if (nombre.trim().length < 2) errores.nombre = 'El nombre debe tener al menos 2 caracteres.';
  if (!/^\S+@\S+\.\S+$/.test(correo.trim())) errores.correo = 'El correo no es válido.';
  if (contrasena.length < 8) errores.contrasena = 'La contraseña debe tener al menos 8 caracteres.';
  else if (!/[A-Za-z]/.test(contrasena) || !/\d/.test(contrasena)) {
    errores.contrasena = 'La contraseña debe tener al menos una letra y un número.';
  }
  if (confirmacion !== contrasena) errores.confirmacion = 'Las contraseñas no coinciden.';
  return errores;
}

// Crear cuenta (POST /auth/registro). Al terminar, la sesión queda iniciada y aparece el catálogo.
export default function Registro() {
  const { registrar } = useSesion();
  const [valores, setValores] = useState({ nombre: '', correo: '', carrera: '', contrasena: '', confirmacion: '' });
  const [errores, setErrores] = useState({});
  const [errorGeneral, setErrorGeneral] = useState('');
  const [enviando, setEnviando] = useState(false);

  const cambiar = (campo) => (valor) => setValores((actuales) => ({ ...actuales, [campo]: valor }));

  const enviar = async () => {
    const encontrados = validar(valores);
    setErrores(encontrados);
    setErrorGeneral('');
    if (Object.keys(encontrados).length > 0) return;

    setEnviando(true);
    try {
      const { nombre, correo, contrasena, carrera } = valores;
      await registrar({
        nombre: nombre.trim(),
        correo: correo.trim().toLowerCase(),
        contrasena,
        carrera: carrera.trim() || undefined,
      });
      // No hace falta navegar: al haber sesión, el layout muestra las pestañas.
    } catch (error) {
      setErrorGeneral(error.message); // por ejemplo, 409: ese correo ya tiene cuenta
      setEnviando(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }} keyboardVerticalOffset={90}>
      <ScrollView style={{ flex: 1, backgroundColor: colores.fondo }} contentContainerStyle={{ padding: 20 }}
        keyboardShouldPersistTaps="handled">
        <Alerta texto={errorGeneral} />
        <Campo etiqueta="Nombre" error={errores.nombre}>
          <Entrada invalido={errores.nombre} value={valores.nombre} onChangeText={cambiar('nombre')} autoComplete="name"
            textContentType="name" maxLength={80} />
        </Campo>
        <Campo etiqueta="Correo" error={errores.correo}>
          <Entrada invalido={errores.correo} value={valores.correo} onChangeText={cambiar('correo')} keyboardType="email-address"
            autoCapitalize="none" autoComplete="email" textContentType="emailAddress" placeholder="tu.nombre@alumnos.cl" />
        </Campo>
        <Campo etiqueta="Carrera (opcional)">
          <Entrada value={valores.carrera} onChangeText={cambiar('carrera')} maxLength={80} />
        </Campo>
        <Campo etiqueta="Contraseña" error={errores.contrasena} ayuda="Al menos 8 caracteres, con una letra y un número.">
          <Entrada invalido={errores.contrasena} value={valores.contrasena} onChangeText={cambiar('contrasena')} secureTextEntry
            autoComplete="new-password" textContentType="newPassword" />
        </Campo>
        <Campo etiqueta="Repite la contraseña" error={errores.confirmacion}>
          <Entrada invalido={errores.confirmacion} value={valores.confirmacion} onChangeText={cambiar('confirmacion')}
            secureTextEntry textContentType="newPassword" onSubmitEditing={enviar} />
        </Campo>
        <Boton texto="Crear cuenta" alTocar={enviar} ocupado={enviando} style={{ marginTop: 8 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
