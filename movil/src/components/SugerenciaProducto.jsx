import { Ionicons } from '@expo/vector-icons';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { sugerirProducto } from '../services/servicios';
import { colores } from '../tema';

const ESPERA = 700; // milisegundos sin escribir antes de consultar
const LARGO_MINIMO = 4;

/**
 * Igual que en la web (HU-08): mientras se escribe el título, el backend le pregunta a Mercado Libre
 * qué producto es y propone categoría, marca y modelo. «Usar sugerencia» los copia al formulario.
 * Si Mercado Libre no responde, solo se muestra un aviso y se sigue a mano.
 *
 * @param {string} titulo Título que se está escribiendo
 * @param {(cambios: object) => void} alAplicar Recibe categoriaId, marca y modelo
 */
export default function SugerenciaProducto({ titulo, alAplicar }) {
  // Cada resultado recuerda para qué título fue: si el título cambió, ya no sirve.
  const [resultado, setResultado] = useState({ titulo: '', estado: 'nada' });
  const [aplicadaPara, setAplicadaPara] = useState('');
  const ultimaConsulta = useRef(0);
  const tituloLimpio = titulo.trim();

  useEffect(() => {
    if (tituloLimpio.length < LARGO_MINIMO) return undefined;
    const temporizador = setTimeout(async () => {
      const numero = ++ultimaConsulta.current;
      setResultado({ titulo: tituloLimpio, estado: 'buscando' });
      try {
        const sugerencia = await sugerirProducto(tituloLimpio);
        if (numero === ultimaConsulta.current) setResultado({ titulo: tituloLimpio, estado: 'lista', sugerencia });
      } catch (error) {
        if (numero === ultimaConsulta.current) setResultado({ titulo: tituloLimpio, estado: 'error', error });
      }
    }, ESPERA);
    return () => clearTimeout(temporizador); // sigue escribiendo: se espera de nuevo
  }, [tituloLimpio]);

  if (tituloLimpio.length < LARGO_MINIMO || resultado.titulo !== tituloLimpio) return null;

  if (resultado.estado === 'buscando') {
    return (
      <View style={[estilos.caja, estilos.fila]} accessibilityRole="progressbar">
        <ActivityIndicator size="small" color={colores.primario} />
        <Text style={estilos.suave}>Buscando sugerencias en Mercado Libre…</Text>
      </View>
    );
  }

  if (resultado.estado === 'error') {
    return (
      <View style={[estilos.caja, estilos.aviso, estilos.fila]}>
        <Ionicons name="cloud-offline-outline" size={18} color={colores.aviso} />
        <Text style={[estilos.suave, { flex: 1 }]}>
          {resultado.error.estado === 503 ? resultado.error.message : 'No se pudieron cargar sugerencias. Completa los datos a mano.'}
        </Text>
      </View>
    );
  }

  const { encontrada, categoria, categoriaMercadoLibre, marca, modelo } = resultado.sugerencia;
  if (!encontrada) return null;

  const aplicar = () => {
    alAplicar({
      ...(categoria && { categoriaId: categoria.id }),
      ...(marca && { marca }),
      ...(modelo && { modelo }),
    });
    setAplicadaPara(tituloLimpio);
  };

  return (
    <View style={estilos.caja} accessibilityLabel="Sugerencia de Mercado Libre">
      <Text style={estilos.texto}>
        <Ionicons name="sparkles-outline" size={14} color={colores.primario} /> Mercado Libre lo reconoce como{' '}
        <Text style={estilos.negrita}>{categoriaMercadoLibre.nombre}</Text>.
        {categoria && <Text> Categoría: <Text style={estilos.negrita}>{categoria.nombre}</Text>.</Text>}
        {marca && <Text> Marca: <Text style={estilos.negrita}>{marca}</Text>.</Text>}
        {modelo && <Text> Modelo: <Text style={estilos.negrita}>{modelo}</Text>.</Text>}
      </Text>
      {aplicadaPara === tituloLimpio ? (
        <Text style={estilos.aplicada}>✓ Aplicada</Text>
      ) : (
        <Pressable style={estilos.boton} onPress={aplicar} accessibilityRole="button">
          <Text style={estilos.textoBoton}>Usar sugerencia</Text>
        </Pressable>
      )}
    </View>
  );
}

const estilos = StyleSheet.create({
  caja: {
    marginTop: 8,
    padding: 12,
    gap: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colores.primarioClaro,
    backgroundColor: colores.fondoSuave,
  },
  aviso: { borderColor: colores.aviso, borderStyle: 'dashed' },
  fila: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  texto: { color: colores.texto, lineHeight: 20 },
  negrita: { fontWeight: '700' },
  suave: { color: colores.textoSuave },
  boton: { alignSelf: 'flex-start', backgroundColor: colores.primario, borderRadius: 6, paddingHorizontal: 14, paddingVertical: 8 },
  textoBoton: { color: '#fff', fontWeight: '600' },
  aplicada: { color: colores.exito, fontWeight: '600' },
});
