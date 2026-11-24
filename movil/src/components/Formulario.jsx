import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { colores } from '../tema';

// Piezas de formulario que usan todas las pantallas, para que se vean y se comporten igual.

/** Etiqueta + contenido + mensaje de error (o de ayuda) debajo. */
export function Campo({ etiqueta, error, ayuda, children }) {
  return (
    <View style={{ marginBottom: 14 }}>
      {etiqueta ? <Text style={estilos.etiqueta}>{etiqueta}</Text> : null}
      {children}
      {error ? <Text style={estilos.error}>{error}</Text> : ayuda ? <Text style={estilos.ayuda}>{ayuda}</Text> : null}
    </View>
  );
}

/** Campo de texto con borde rojo cuando tiene error. */
export function Entrada({ invalido, multilinea, style, ...props }) {
  return (
    <TextInput
      style={[estilos.entrada, multilinea && estilos.multilinea, invalido && estilos.invalido, style]}
      multiline={multilinea}
      placeholderTextColor={colores.textoSuave}
      {...props}
    />
  );
}

/** Botones para elegir una opción (categoría, condición, orden…). */
export function Opciones({ opciones, elegida, alElegir }) {
  return (
    <View style={estilos.opciones}>
      {opciones.map((opcion) => {
        const activa = opcion.valor === elegida;
        return (
          <Pressable
            key={opcion.valor}
            onPress={() => alElegir(opcion.valor)}
            style={[estilos.opcion, activa && estilos.opcionActiva]}
            accessibilityRole="radio"
            accessibilityState={{ checked: activa }}
          >
            <Text style={[{ color: colores.texto }, activa && { color: '#fff', fontWeight: '600' }]}>{opcion.texto}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const VARIANTES = {
  primario: { fondo: colores.primario, texto: '#fff', borde: colores.primario },
  secundario: { fondo: 'transparent', texto: colores.primario, borde: colores.primario },
  exito: { fondo: colores.exito, texto: '#fff', borde: colores.exito },
  peligro: { fondo: 'transparent', texto: colores.peligro, borde: colores.peligro },
};

/** Botón con variante, ícono opcional y estado «ocupado» (muestra una rueda y no se puede tocar). */
export function Boton({ texto, alTocar, variante = 'primario', icono, ocupado = false, deshabilitado = false, style }) {
  const v = VARIANTES[variante];
  const inactivo = ocupado || deshabilitado;
  return (
    <Pressable
      onPress={alTocar}
      disabled={inactivo}
      style={[estilos.boton, { backgroundColor: v.fondo, borderColor: v.borde }, inactivo && { opacity: 0.5 }, style]}
      accessibilityRole="button"
      accessibilityState={{ disabled: inactivo, busy: ocupado }}
    >
      {ocupado ? (
        <ActivityIndicator color={v.texto} />
      ) : (
        <>
          {icono && <Ionicons name={icono} size={18} color={v.texto} />}
          <Text style={[estilos.textoBoton, { color: v.texto }]}>{texto}</Text>
        </>
      )}
    </Pressable>
  );
}

/** Recuadro de error (rojo) o de éxito (verde) arriba de un formulario. */
export function Alerta({ texto, tipo = 'error' }) {
  if (!texto) return null;
  const color = tipo === 'error' ? colores.peligro : colores.exito;
  return (
    <View style={[estilos.alerta, { borderColor: color, backgroundColor: tipo === 'error' ? '#fef2f2' : '#ecfdf5' }]} accessibilityRole="alert">
      <Text style={{ color }}>{texto}</Text>
    </View>
  );
}

const estilos = StyleSheet.create({
  etiqueta: { fontWeight: '600', color: colores.texto, marginBottom: 6 },
  error: { color: colores.peligro, marginTop: 4, fontSize: 13 },
  ayuda: { color: colores.textoSuave, marginTop: 4, fontSize: 13 },
  entrada: { borderWidth: 1, borderColor: colores.borde, borderRadius: 8, padding: 11, fontSize: 16, color: colores.texto },
  multilinea: { minHeight: 100, textAlignVertical: 'top' },
  invalido: { borderColor: colores.peligro },
  opciones: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  opcion: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 16, borderWidth: 1, borderColor: colores.borde },
  opcionActiva: { backgroundColor: colores.primario, borderColor: colores.primario },
  boton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  textoBoton: { fontWeight: '700', fontSize: 15 },
  alerta: { borderWidth: 1, borderRadius: 8, padding: 12, marginBottom: 12 },
});
