import { File } from 'expo-file-system';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import { ActivityIndicator, Alert, Image, KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import usePeticion from '../hooks/usePeticion';
import { urlImagen } from '../services/api';
import { listarCategorias } from '../services/servicios';
import { CONDICIONES, colores } from '../tema';
import { Alerta, Boton, Campo, Entrada, Opciones } from './Formulario';
import SugerenciaProducto from './SugerenciaProducto';

const ANCHO_FOTO = 1280; // píxeles: se ve bien y queda muy por debajo de los 2 MB del backend
const vacio = { titulo: '', descripcion: '', categoriaId: null, precio: '', stock: '1', condicion: 'usado', marca: '', modelo: '' };

// Mismas reglas que el formulario web y que los DTO del backend. Se revisan antes de enviar para
// avisar rápido; la validación que manda es la del backend.
function validar(valores, esEdicion) {
  const errores = {};
  const titulo = valores.titulo.trim();
  const descripcion = valores.descripcion.trim();
  const precio = Number(valores.precio);
  const stock = Number(valores.stock);
  const stockMinimo = esEdicion ? 0 : 1;
  if (titulo.length < 3 || titulo.length > 120) errores.titulo = 'El título debe tener entre 3 y 120 caracteres.';
  if (descripcion.length < 20) errores.descripcion = 'La descripción debe tener al menos 20 caracteres.';
  if (!valores.categoriaId) errores.categoriaId = 'Elige una categoría.';
  if (valores.precio === '' || !Number.isInteger(precio) || precio < 1 || precio > 100_000_000) {
    errores.precio = 'El precio debe ser un número entero entre 1 y 100.000.000.';
  }
  if (valores.stock === '' || !Number.isInteger(stock) || stock < stockMinimo || stock > 999) {
    errores.stock = esEdicion ? 'Las unidades deben estar entre 0 y 999.' : 'Para publicar, las unidades deben estar entre 1 y 999.';
  }
  return errores;
}

/**
 * Formulario de producto, compartido por «Publicar» y «Editar».
 * @param {object} [producto] Si viene, el formulario edita ese producto
 * @param {(datos: FormData) => Promise<void>} alEnviar Lanza ErrorApi si el backend rechaza
 * @param {string} textoBoton
 */
export default function FormularioProducto({ producto, alEnviar, textoBoton }) {
  const esEdicion = Boolean(producto);
  const { datos: categorias } = usePeticion(listarCategorias);
  const [valores, setValores] = useState(() =>
    producto
      ? {
          titulo: producto.titulo,
          descripcion: producto.descripcion,
          categoriaId: producto.categoria.id,
          precio: String(producto.precio),
          stock: String(producto.stock),
          condicion: producto.condicion,
          marca: producto.marca ?? '',
          modelo: producto.modelo ?? '',
        }
      : vacio,
  );
  const [foto, setFoto] = useState(null);
  const [errores, setErrores] = useState({});
  const [errorGeneral, setErrorGeneral] = useState('');
  const [enviando, setEnviando] = useState(false);

  const cambiar = (campo) => (valor) => setValores((actuales) => ({ ...actuales, [campo]: valor }));

  // Cámara o galería. La foto se achica aquí antes de enviarla: una foto del iPhone pesa más de
  // los 2 MB que acepta el backend, y si el servidor la corta a mitad de la subida, iOS solo
  // informa «sin conexión».
  const elegirFoto = async (desdeCamara) => {
    const permiso = desdeCamara
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permiso.granted) {
      Alert.alert('Sin permiso', 'Puedes darlo en Configuración del teléfono, o seguir sin foto.');
      return;
    }
    const opciones = { mediaTypes: ['images'], allowsEditing: true, aspect: [1, 1], quality: 1 };
    const resultado = desdeCamara
      ? await ImagePicker.launchCameraAsync(opciones)
      : await ImagePicker.launchImageLibraryAsync(opciones);
    if (resultado.canceled) return;
    try {
      const original = resultado.assets[0];
      const imagen = await ImageManipulator.manipulate(original.uri)
        .resize({ width: Math.min(ANCHO_FOTO, original.width) })
        .renderAsync();
      const reducida = await imagen.saveAsync({ compress: 0.7, format: SaveFormat.JPEG });
      setFoto({ uri: reducida.uri });
    } catch {
      Alert.alert('No se pudo usar la foto', 'Prueba con otra o sigue sin foto.');
    }
  };

  const enviar = async () => {
    const encontrados = validar(valores, esEdicion);
    setErrores(encontrados);
    setErrorGeneral('');
    if (Object.keys(encontrados).length > 0) return;

    const datos = new FormData();
    for (const [clave, valor] of Object.entries(valores)) datos.append(clave, String(valor).trim());
    // Desde Expo 58, fetch no acepta el formato antiguo { uri, name, type }: la foto se adjunta como
    // File de expo-file-system, que trae su nombre, su tipo (image/jpeg) y su contenido.
    if (foto) datos.append('imagen', new File(foto.uri));

    setEnviando(true);
    try {
      await alEnviar(datos);
      if (!esEdicion) {
        setValores(vacio);
        setFoto(null);
      }
    } catch (error) {
      setErrorGeneral(
        error.estado === 0 && foto ? 'No se pudo subir la publicación. Prueba con otra foto o sigue sin foto.' : error.message,
      );
    } finally {
      setEnviando(false);
    }
  };

  const vistaPrevia = foto?.uri ?? urlImagen(producto?.imagen);

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }} keyboardVerticalOffset={90}>
      <ScrollView style={{ flex: 1, backgroundColor: colores.fondo }} contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        keyboardShouldPersistTaps="handled">
        <Alerta texto={errorGeneral} />

        <Campo etiqueta="Título" error={errores.titulo}>
          <Entrada invalido={errores.titulo} value={valores.titulo} onChangeText={cambiar('titulo')} maxLength={120}
            placeholder="Por ejemplo: Calculadora Casio fx-570" />
          {!esEdicion && (
            <SugerenciaProducto
              titulo={valores.titulo}
              alAplicar={(cambios) => setValores((actuales) => ({ ...actuales, ...cambios }))}
            />
          )}
        </Campo>

        <Campo etiqueta="Descripción" error={errores.descripcion}
          ayuda={`${valores.descripcion.trim().length} de 2000 caracteres (mínimo 20).`}>
          <Entrada multilinea invalido={errores.descripcion} value={valores.descripcion} onChangeText={cambiar('descripcion')}
            maxLength={2000} placeholder="Estado, qué incluye, dónde se puede entregar…" />
        </Campo>

        <Campo etiqueta="Categoría" error={errores.categoriaId}>
          {categorias ? (
            <Opciones opciones={categorias.map((c) => ({ valor: c.id, texto: c.nombre }))}
              elegida={valores.categoriaId} alElegir={cambiar('categoriaId')} />
          ) : (
            <ActivityIndicator style={{ alignSelf: 'flex-start' }} />
          )}
        </Campo>

        <Campo etiqueta="Condición">
          <Opciones opciones={CONDICIONES} elegida={valores.condicion} alElegir={cambiar('condicion')} />
        </Campo>

        <View style={{ flexDirection: 'row', gap: 10 }}>
          <View style={{ flex: 1 }}>
            <Campo etiqueta="Precio (CLP)" error={errores.precio}>
              <Entrada invalido={errores.precio} value={valores.precio} onChangeText={cambiar('precio')}
                keyboardType="number-pad" placeholder="15000" />
            </Campo>
          </View>
          <View style={{ flex: 1 }}>
            <Campo etiqueta="Unidades" error={errores.stock} ayuda={esEdicion ? 'Con 0 queda agotada.' : undefined}>
              <Entrada invalido={errores.stock} value={valores.stock} onChangeText={cambiar('stock')} keyboardType="number-pad" />
            </Campo>
          </View>
        </View>

        <View style={{ flexDirection: 'row', gap: 10 }}>
          <View style={{ flex: 1 }}>
            <Campo etiqueta="Marca (opcional)">
              <Entrada value={valores.marca} onChangeText={cambiar('marca')} maxLength={60} />
            </Campo>
          </View>
          <View style={{ flex: 1 }}>
            <Campo etiqueta="Modelo (opcional)">
              <Entrada value={valores.modelo} onChangeText={cambiar('modelo')} maxLength={60} />
            </Campo>
          </View>
        </View>

        <Campo etiqueta={esEdicion ? 'Foto (elige una para reemplazar la actual)' : 'Foto (opcional)'}>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <Boton variante="secundario" icono="camera-outline" texto="Tomar foto" alTocar={() => elegirFoto(true)} style={{ flex: 1 }} />
            <Boton variante="secundario" icono="images-outline" texto="Galería" alTocar={() => elegirFoto(false)} style={{ flex: 1 }} />
          </View>
          {vistaPrevia && (
            <View style={{ marginTop: 10 }}>
              <Image source={{ uri: vistaPrevia }} style={{ width: 140, height: 140, borderRadius: 8 }}
                accessibilityLabel="Vista previa de la foto" />
              {foto && (
                <Pressable onPress={() => setFoto(null)} accessibilityRole="button">
                  <Text style={{ color: colores.peligro, marginTop: 6 }}>{esEdicion ? 'Mantener la foto actual' : 'Quitar foto'}</Text>
                </Pressable>
              )}
            </View>
          )}
        </Campo>

        <Boton texto={textoBoton} alTocar={enviar} ocupado={enviando} style={{ marginTop: 8 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
