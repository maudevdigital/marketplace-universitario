import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { FlatList, Pressable, RefreshControl, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Cargando, EstadoVacio, MensajeError } from '../../components/Estados';
import TarjetaProducto from '../../components/TarjetaProducto';
import usePeticion from '../../hooks/usePeticion';
import { listarCategorias, listarProductos } from '../../services/servicios';
import { colores } from '../../tema';

const ORDENES = [
  { valor: '', texto: 'Más recientes' },
  { valor: 'precio_asc', texto: 'Menor precio' },
  { valor: 'precio_desc', texto: 'Mayor precio' },
];
const SIN_FILTROS = { q: '', categoria: null, precioMin: '', precioMax: '', orden: '', pagina: 1 };

// Buscar productos: texto, categoría, rango de precio, orden y páginas, todo resuelto por el
// backend (GET /productos), igual que en la web.
export default function Catalogo() {
  const [texto, setTexto] = useState('');
  const [filtros, setFiltros] = useState(SIN_FILTROS);
  const [verFiltros, setVerFiltros] = useState(false);
  const [precios, setPrecios] = useState({ min: '', max: '' });

  const { datos, cargando, error, recargar } = usePeticion(() => listarProductos(filtros), [filtros]);
  const { datos: categorias } = usePeticion(listarCategorias);

  const cambiar = (cambios) => setFiltros((actuales) => ({ ...actuales, pagina: 1, ...cambios }));
  const buscar = () => cambiar({ q: texto.trim() });
  const soloDigitos = (valor) => valor.replace(/\D/g, '');
  const aplicarPrecios = () => cambiar({ precioMin: precios.min, precioMax: precios.max });
  const limpiar = () => {
    setTexto('');
    setPrecios({ min: '', max: '' });
    setFiltros(SIN_FILTROS);
  };
  const hayFiltros = Boolean(filtros.q || filtros.categoria || filtros.precioMin || filtros.precioMax || filtros.orden);

  return (
    <View style={estilos.pantalla}>
      <View style={estilos.buscador}>
        <Ionicons name="search" size={18} color={colores.textoSuave} />
        <TextInput
          style={estilos.campoBusqueda}
          value={texto}
          onChangeText={(valor) => {
            setTexto(valor);
            // Al borrar todo (también con la «x»), la búsqueda se quita sin tener que apretar «Buscar».
            if (!valor.trim() && filtros.q) cambiar({ q: '' });
          }}
          onSubmitEditing={buscar}
          placeholder="Buscar: calculadora, guitarra, notebook…"
          returnKeyType="search"
          clearButtonMode="while-editing"
          accessibilityLabel="Buscar productos"
        />
        <Pressable onPress={() => setVerFiltros((v) => !v)} hitSlop={8} accessibilityRole="button"
          accessibilityLabel="Precio y orden" accessibilityState={{ expanded: verFiltros }}>
          <Ionicons name="options-outline" size={22} color={filtros.precioMin || filtros.precioMax || filtros.orden ? colores.primario : colores.textoSuave} />
        </Pressable>
      </View>

      {verFiltros && (
        <View style={estilos.panel}>
          <Text style={estilos.etiqueta}>Ordenar por</Text>
          <View style={estilos.fila}>
            {ORDENES.map((orden) => (
              <Chip key={orden.valor} texto={orden.texto} activo={filtros.orden === orden.valor}
                alTocar={() => cambiar({ orden: orden.valor })} />
            ))}
          </View>
          <Text style={estilos.etiqueta}>Precio (CLP)</Text>
          <View style={estilos.fila}>
            <TextInput style={estilos.precio} value={precios.min} placeholder="Mínimo" keyboardType="number-pad"
              onChangeText={(v) => setPrecios((p) => ({ ...p, min: soloDigitos(v) }))} onSubmitEditing={aplicarPrecios} />
            <TextInput style={estilos.precio} value={precios.max} placeholder="Máximo" keyboardType="number-pad"
              onChangeText={(v) => setPrecios((p) => ({ ...p, max: soloDigitos(v) }))} onSubmitEditing={aplicarPrecios} />
            <Pressable style={estilos.aplicar} onPress={aplicarPrecios} accessibilityRole="button">
              <Text style={{ color: '#fff', fontWeight: '700' }}>Aplicar</Text>
            </Pressable>
          </View>
        </View>
      )}

      {/* flexGrow 0: sin esto, la lista de abajo le quita altura y los botones se cortan */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={estilos.filaCategorias}
        contentContainerStyle={estilos.categorias}
      >
        <Chip texto="Todas" activo={!filtros.categoria} alTocar={() => cambiar({ categoria: null })} />
        {categorias?.map((categoria) => (
          <Chip
            key={categoria.id}
            texto={categoria.nombre}
            activo={filtros.categoria === categoria.id}
            alTocar={() => cambiar({ categoria: categoria.id })}
          />
        ))}
      </ScrollView>

      {/* Siempre a la vista mientras haya algún filtro, no solo cuando no hay resultados */}
      {hayFiltros && datos && (
        <View style={estilos.filtrosActivos}>
          <Text style={{ color: colores.textoSuave }}>
            {datos.total === 1 ? '1 resultado' : `${datos.total} resultados`}
          </Text>
          <Pressable onPress={limpiar} hitSlop={8} accessibilityRole="button" style={estilos.quitar}>
            <Ionicons name="close-circle" size={16} color={colores.primario} />
            <Text style={estilos.enlace}>Quitar filtros</Text>
          </Pressable>
        </View>
      )}

      {error ? (
        <MensajeError error={error} alReintentar={recargar} />
      ) : !datos ? (
        <Cargando texto="Cargando productos…" />
      ) : (
        <FlatList
          data={datos.productos}
          keyExtractor={(producto) => String(producto.id)}
          renderItem={({ item }) => <TarjetaProducto producto={item} />}
          refreshControl={<RefreshControl refreshing={cargando} onRefresh={recargar} />}
          ListEmptyComponent={
            <View style={{ flex: 1 }}>
              <EstadoVacio icono="search-outline" titulo="No encontramos productos" texto="Prueba con otra palabra, categoría o precio." />
            </View>
          }
          ListFooterComponent={
            datos.totalPaginas > 1 ? (
              <Paginas
                pagina={datos.pagina}
                total={datos.totalPaginas}
                alCambiar={(pagina) => setFiltros((actuales) => ({ ...actuales, pagina }))}
              />
            ) : null
          }
          contentContainerStyle={datos.productos.length === 0 && { flexGrow: 1 }}
        />
      )}
    </View>
  );
}

function Chip({ texto, activo, alTocar }) {
  return (
    <Pressable
      onPress={alTocar}
      style={[estilos.chip, activo && estilos.chipActivo]}
      accessibilityRole="button"
      accessibilityState={{ selected: activo }}
    >
      <Text style={[estilos.textoChip, activo && estilos.textoChipActivo]}>{texto}</Text>
    </Pressable>
  );
}

function Paginas({ pagina, total, alCambiar }) {
  return (
    <View style={estilos.paginas}>
      <Pressable disabled={pagina <= 1} onPress={() => alCambiar(pagina - 1)} accessibilityRole="button">
        <Text style={[estilos.enlace, pagina <= 1 && estilos.deshabilitado]}>‹ Anterior</Text>
      </Pressable>
      <Text style={{ color: colores.textoSuave }}>Página {pagina} de {total}</Text>
      <Pressable disabled={pagina >= total} onPress={() => alCambiar(pagina + 1)} accessibilityRole="button">
        <Text style={[estilos.enlace, pagina >= total && estilos.deshabilitado]}>Siguiente ›</Text>
      </Pressable>
    </View>
  );
}

const estilos = StyleSheet.create({
  pantalla: { flex: 1, backgroundColor: colores.fondo },
  buscador: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    margin: 12,
    marginBottom: 4,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: colores.fondoSuave,
    borderWidth: 1,
    borderColor: colores.borde,
  },
  campoBusqueda: { flex: 1, paddingVertical: 10, fontSize: 16, color: colores.texto },
  filaCategorias: { flexGrow: 0, flexShrink: 0 },
  categorias: { gap: 8, paddingHorizontal: 12, paddingVertical: 8, alignItems: 'center' },
  chip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 16, borderWidth: 1, borderColor: colores.borde },
  chipActivo: { backgroundColor: colores.primario, borderColor: colores.primario },
  textoChip: { color: colores.texto },
  textoChipActivo: { color: '#fff', fontWeight: '600' },
  panel: { marginHorizontal: 12, padding: 12, gap: 8, borderRadius: 10, backgroundColor: colores.fondoSuave },
  etiqueta: { fontWeight: '600', color: colores.texto },
  fila: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, alignItems: 'center' },
  precio: {
    flex: 1,
    minWidth: 90,
    borderWidth: 1,
    borderColor: colores.borde,
    borderRadius: 8,
    padding: 9,
    backgroundColor: colores.fondo,
    color: colores.texto,
  },
  filtrosActivos: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingBottom: 6,
  },
  quitar: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  aplicar: { backgroundColor: colores.primario, borderRadius: 8, paddingHorizontal: 14, paddingVertical: 10 },
  paginas: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16 },
  enlace: { color: colores.primario, fontWeight: '600' },
  deshabilitado: { color: colores.borde },
});
