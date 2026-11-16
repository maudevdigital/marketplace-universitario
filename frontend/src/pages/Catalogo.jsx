import { useSearchParams } from 'react-router-dom';
import Cargando from '../components/Cargando';
import EstadoVacio from '../components/EstadoVacio';
import MensajeError from '../components/MensajeError';
import BotonFavorito from '../components/BotonFavorito';
import Paginacion from '../components/Paginacion';
import TarjetaProducto from '../components/TarjetaProducto';
import usePeticion from '../hooks/usePeticion';
import { listarCategorias } from '../services/categorias';
import { listarProductos } from '../services/productos';

const ORDENES = [
  { valor: 'recientes', texto: 'Más recientes' },
  { valor: 'precio_asc', texto: 'Precio: menor a mayor' },
  { valor: 'precio_desc', texto: 'Precio: mayor a menor' },
];

const FILTROS = ['q', 'categoria', 'precioMin', 'precioMax', 'orden', 'pagina'];

// Catálogo público (HU-06). Los filtros viven en la dirección (/catalogo?q=calculo&categoria=2),
// así se pueden compartir, el botón «atrás» funciona y la portada puede enlazar a una categoría.
export default function Catalogo() {
  const [parametros, setParametros] = useSearchParams();
  const filtros = Object.fromEntries(FILTROS.map((clave) => [clave, parametros.get(clave) ?? '']));

  const { datos, cargando, error, recargar } = usePeticion(() => listarProductos(filtros), [parametros.toString()]);
  const { datos: categorias } = usePeticion(listarCategorias);

  // Cualquier cambio de filtro vuelve a la primera página.
  const aplicar = (cambios, { conservarPagina = false } = {}) => {
    const siguientes = new URLSearchParams(parametros);
    for (const [clave, valor] of Object.entries(cambios)) {
      if (valor === '' || valor === undefined || valor === null) siguientes.delete(clave);
      else siguientes.set(clave, String(valor));
    }
    if (!conservarPagina) siguientes.delete('pagina');
    setParametros(siguientes);
  };

  const buscar = (evento) => {
    evento.preventDefault();
    const formulario = new FormData(evento.currentTarget);
    aplicar({
      q: formulario.get('q').trim(),
      precioMin: formulario.get('precioMin'),
      precioMax: formulario.get('precioMax'),
    });
  };

  const hayFiltros = FILTROS.some((clave) => clave !== 'orden' && clave !== 'pagina' && filtros[clave]);

  return (
    <section className="container py-5">
      <h1 className="h3 mb-4">Catálogo</h1>

      {/* key: si la dirección cambia desde afuera (atrás, enlace de la portada), el formulario se reinicia */}
      <form key={parametros.toString()} onSubmit={buscar} className="row g-2 align-items-end mb-4" role="search">
        <div className="col-12 col-lg-4">
          <label htmlFor="filtro-q" className="form-label small">Buscar</label>
          <input id="filtro-q" name="q" type="search" className="form-control" maxLength={100}
            placeholder="Título, marca o modelo" defaultValue={filtros.q} />
        </div>
        <div className="col-6 col-lg-2">
          <label htmlFor="filtro-categoria" className="form-label small">Categoría</label>
          <select id="filtro-categoria" className="form-select" value={filtros.categoria}
            onChange={(evento) => aplicar({ categoria: evento.target.value })}>
            <option value="">Todas</option>
            {categorias?.map((categoria) => (
              <option key={categoria.id} value={categoria.id}>{categoria.nombre}</option>
            ))}
          </select>
        </div>
        <div className="col-6 col-lg-2">
          <label htmlFor="filtro-orden" className="form-label small">Ordenar por</label>
          <select id="filtro-orden" className="form-select" value={filtros.orden || 'recientes'}
            onChange={(evento) => aplicar({ orden: evento.target.value === 'recientes' ? '' : evento.target.value })}>
            {ORDENES.map((orden) => <option key={orden.valor} value={orden.valor}>{orden.texto}</option>)}
          </select>
        </div>
        <div className="col-6 col-lg-1">
          <label htmlFor="filtro-min" className="form-label small">Precio mín.</label>
          <input id="filtro-min" name="precioMin" type="number" min="0" step="1000" inputMode="numeric"
            className="form-control" defaultValue={filtros.precioMin} />
        </div>
        <div className="col-6 col-lg-1">
          <label htmlFor="filtro-max" className="form-label small">Precio máx.</label>
          <input id="filtro-max" name="precioMax" type="number" min="0" step="1000" inputMode="numeric"
            className="form-control" defaultValue={filtros.precioMax} />
        </div>
        <div className="col-12 col-lg-2 d-flex gap-2">
          <button type="submit" className="btn btn-primary flex-grow-1">
            <i className="bi bi-search me-1" aria-hidden="true" />Buscar
          </button>
          {hayFiltros && (
            <button type="button" className="btn btn-outline-secondary" title="Quitar filtros"
              aria-label="Quitar filtros" onClick={() => setParametros({})}>
              <i className="bi bi-x-lg" aria-hidden="true" />
            </button>
          )}
        </div>
      </form>

      <Resultados datos={datos} cargando={cargando} error={error} recargar={recargar} hayFiltros={hayFiltros}
        alCambiarPagina={(pagina) => aplicar({ pagina: pagina === 1 ? '' : pagina }, { conservarPagina: true })}
        alLimpiar={() => setParametros({})} />
    </section>
  );
}

function Resultados({ datos, cargando, error, recargar, hayFiltros, alCambiarPagina, alLimpiar }) {
  if (cargando) return <Cargando texto="Buscando productos…" />;
  // Un 400 son filtros inválidos: reintentar no sirve, hay que corregirlos.
  if (error) return <MensajeError error={error} alReintentar={error.estado === 400 ? undefined : recargar} />;

  if (datos.total === 0) {
    return hayFiltros ? (
      <EstadoVacio icono="search" titulo="No encontramos productos" texto="Prueba con otras palabras o quita algún filtro.">
        <button type="button" className="btn btn-outline-primary" onClick={alLimpiar}>Ver todo el catálogo</button>
      </EstadoVacio>
    ) : (
      <EstadoVacio icono="bag" titulo="Todavía no hay publicaciones" texto="Vuelve más tarde o publica lo que ya no usas." />
    );
  }

  return (
    <>
      <p className="small text-muted" aria-live="polite">
        {datos.total} {datos.total === 1 ? 'producto' : 'productos'}
        {datos.totalPaginas > 1 && ` · página ${datos.pagina} de ${datos.totalPaginas}`}
      </p>
      {datos.productos.length === 0 ? (
        <EstadoVacio icono="signpost" titulo="Esta página no existe" texto="Vuelve a la primera página.">
          <button type="button" className="btn btn-outline-primary" onClick={() => alCambiarPagina(1)}>Ir a la página 1</button>
        </EstadoVacio>
      ) : (
        <ul className="row g-3 list-unstyled">
          {datos.productos.map((producto) => (
            <li key={producto.id} className="col-12 col-sm-6 col-lg-4 col-xl-3">
              <TarjetaProducto producto={producto}>
                <div className="d-flex justify-content-between align-items-center gap-2">
                  <span className="small text-muted text-truncate">{producto.vendedor.nombre}</span>
                  <BotonFavorito producto={producto} />
                </div>
              </TarjetaProducto>
            </li>
          ))}
        </ul>
      )}
      <Paginacion pagina={datos.pagina} totalPaginas={datos.totalPaginas} alCambiar={alCambiarPagina} />
    </>
  );
}
