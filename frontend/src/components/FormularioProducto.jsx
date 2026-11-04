import { useEffect, useState } from 'react';
import usePeticion from '../hooks/usePeticion';
import { urlImagen } from '../services/api';
import { listarCategorias } from '../services/categorias';

const TIPOS_IMAGEN = ['image/jpeg', 'image/png', 'image/webp'];
const TAMANO_MAXIMO = 2 * 1024 * 1024;

const CONDICIONES = [
  { valor: 'nuevo', texto: 'Nuevo' },
  { valor: 'como_nuevo', texto: 'Como nuevo' },
  { valor: 'usado', texto: 'Usado' },
];

// Mismas reglas que CrearProductoDto y ActualizarProductoDto del backend. Se repiten para
// avisar antes de enviar, pero la validación que manda es la del backend.
function validar(valores, imagen, esEdicion) {
  const errores = {};
  const titulo = valores.titulo.trim();
  const descripcion = valores.descripcion.trim();
  const precio = Number(valores.precio);
  const stock = Number(valores.stock);
  const stockMinimo = esEdicion ? 0 : 1;

  if (titulo.length < 3 || titulo.length > 120) errores.titulo = 'El título debe tener entre 3 y 120 caracteres.';
  if (descripcion.length < 20) errores.descripcion = 'La descripción debe tener al menos 20 caracteres.';
  else if (descripcion.length > 2000) errores.descripcion = 'La descripción no puede superar los 2000 caracteres.';
  if (!valores.categoriaId) errores.categoriaId = 'Elige una categoría.';
  if (valores.precio === '' || !Number.isInteger(precio) || precio < 1) {
    errores.precio = 'El precio debe ser un número entero mayor que cero.';
  } else if (precio > 100_000_000) errores.precio = 'El precio no puede superar los $100.000.000.';
  if (valores.stock === '' || !Number.isInteger(stock) || stock < stockMinimo || stock > 999) {
    errores.stock = esEdicion ? 'El stock debe estar entre 0 y 999.' : 'Para publicar, el stock debe estar entre 1 y 999.';
  }
  if (valores.marca.trim().length > 60) errores.marca = 'La marca no puede superar los 60 caracteres.';
  if (valores.modelo.trim().length > 60) errores.modelo = 'El modelo no puede superar los 60 caracteres.';
  if (imagen && !TIPOS_IMAGEN.includes(imagen.type)) errores.imagen = 'La imagen debe ser JPG, PNG o WEBP.';
  else if (imagen && imagen.size > TAMANO_MAXIMO) errores.imagen = 'La imagen supera el tamaño máximo de 2 MB.';
  return errores;
}

const vacio = { titulo: '', descripcion: '', categoriaId: '', precio: '', stock: '1', condicion: 'usado', marca: '', modelo: '' };

/**
 * Formulario de publicación, compartido por «Publicar» y «Editar» (HU-07).
 * @param {object} [producto] Si viene, el formulario edita ese producto
 * @param {(datos: FormData) => Promise<void>} alEnviar Lanza ErrorApi si el backend rechaza
 */
export default function FormularioProducto({ producto, alEnviar, textoBoton }) {
  const esEdicion = Boolean(producto);
  const { datos: categorias, error: errorCategorias, recargar } = usePeticion(listarCategorias);

  const [valores, setValores] = useState(() =>
    producto
      ? {
          titulo: producto.titulo,
          descripcion: producto.descripcion,
          categoriaId: String(producto.categoria.id),
          precio: String(producto.precio),
          stock: String(producto.stock),
          condicion: producto.condicion,
          marca: producto.marca ?? '',
          modelo: producto.modelo ?? '',
        }
      : vacio,
  );
  const [imagen, setImagen] = useState(null);
  const [vistaPrevia, setVistaPrevia] = useState(null);
  const [errores, setErrores] = useState({});
  const [errorGeneral, setErrorGeneral] = useState('');
  const [enviando, setEnviando] = useState(false);

  // La vista previa usa una dirección temporal del navegador: se libera al cambiarla o al salir.
  useEffect(() => () => vistaPrevia && URL.revokeObjectURL(vistaPrevia), [vistaPrevia]);

  const cambiar = (evento) => setValores({ ...valores, [evento.target.name]: evento.target.value });

  const elegirImagen = (evento) => {
    const archivo = evento.target.files?.[0] ?? null;
    setImagen(archivo);
    setVistaPrevia(archivo && TIPOS_IMAGEN.includes(archivo.type) ? URL.createObjectURL(archivo) : null);
  };

  const enviar = async (evento) => {
    evento.preventDefault();
    const encontrados = validar(valores, imagen, esEdicion);
    setErrores(encontrados);
    if (Object.keys(encontrados).length > 0) {
      document.getElementById(Object.keys(encontrados)[0])?.focus();
      return;
    }

    const datos = new FormData();
    for (const [clave, valor] of Object.entries(valores)) datos.append(clave, valor.trim());
    if (imagen) datos.append('imagen', imagen);

    setEnviando(true);
    setErrorGeneral('');
    try {
      await alEnviar(datos);
    } catch (error) {
      setErrorGeneral(error.message);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setEnviando(false);
    }
  };

  // Propiedades comunes de cada campo: valor, error y descripción accesible.
  const campo = (nombre) => ({
    id: nombre,
    name: nombre,
    value: valores[nombre],
    onChange: cambiar,
    'aria-invalid': errores[nombre] ? true : undefined,
    'aria-describedby': errores[nombre] ? `error-${nombre}` : undefined,
  });
  const clase = (nombre, base = 'form-control') => `${base} ${errores[nombre] ? 'is-invalid' : ''}`;
  const error = (nombre) =>
    errores[nombre] && <div id={`error-${nombre}`} className="invalid-feedback">{errores[nombre]}</div>;

  const imagenActual = vistaPrevia ?? (producto?.imagen ? urlImagen(producto.imagen) : null);

  return (
    <form onSubmit={enviar} noValidate>
      {errorGeneral && <div className="alert alert-danger" role="alert">{errorGeneral}</div>}

      <div className="row g-3">
        <div className="col-12">
          {/* HU-08 (Juan) agrega aquí las sugerencias de Mercado Libre mientras se escribe el título. */}
          <label htmlFor="titulo" className="form-label">Título</label>
          <input {...campo('titulo')} type="text" maxLength={120} className={clase('titulo')}
            placeholder="Por ejemplo: Calculadora Casio fx-570" />
          {error('titulo')}
        </div>

        <div className="col-12">
          <label htmlFor="descripcion" className="form-label">Descripción</label>
          <textarea {...campo('descripcion')} rows={5} maxLength={2000} className={clase('descripcion')}
            placeholder="Estado, qué incluye, dónde se puede entregar…" />
          {error('descripcion') || (
            <div className="form-text">{valores.descripcion.trim().length} de 2000 caracteres (mínimo 20).</div>
          )}
        </div>

        <div className="col-12 col-md-6">
          <label htmlFor="categoriaId" className="form-label">Categoría</label>
          <select {...campo('categoriaId')} className={clase('categoriaId', 'form-select')} disabled={!categorias}>
            <option value="">{categorias ? 'Elige una categoría' : 'Cargando categorías…'}</option>
            {categorias?.map((categoria) => (
              <option key={categoria.id} value={categoria.id}>{categoria.nombre}</option>
            ))}
          </select>
          {error('categoriaId')}
          {errorCategorias && (
            <div className="form-text text-danger">
              No se pudieron cargar las categorías.{' '}
              <button type="button" className="btn btn-link btn-sm p-0 align-baseline" onClick={recargar}>Reintentar</button>
            </div>
          )}
        </div>

        <div className="col-12 col-md-6">
          <label htmlFor="condicion" className="form-label">Condición</label>
          <select {...campo('condicion')} className="form-select">
            {CONDICIONES.map((condicion) => <option key={condicion.valor} value={condicion.valor}>{condicion.texto}</option>)}
          </select>
        </div>

        <div className="col-6">
          <label htmlFor="precio" className="form-label">Precio (CLP)</label>
          <input {...campo('precio')} type="number" min="1" step="1" inputMode="numeric" className={clase('precio')} />
          {error('precio')}
        </div>

        <div className="col-6">
          <label htmlFor="stock" className="form-label">Unidades disponibles</label>
          <input {...campo('stock')} type="number" min={esEdicion ? 0 : 1} max="999" step="1" inputMode="numeric" className={clase('stock')} />
          {error('stock') || (esEdicion && <div className="form-text">Con 0 la publicación queda agotada.</div>)}
        </div>

        <div className="col-6">
          <label htmlFor="marca" className="form-label">Marca (opcional)</label>
          <input {...campo('marca')} type="text" maxLength={60} className={clase('marca')} />
          {error('marca')}
        </div>

        <div className="col-6">
          <label htmlFor="modelo" className="form-label">Modelo (opcional)</label>
          <input {...campo('modelo')} type="text" maxLength={60} className={clase('modelo')} />
          {error('modelo')}
        </div>

        <div className="col-12">
          <label htmlFor="imagen" className="form-label">Foto {esEdicion ? '(elige una para reemplazar la actual)' : '(opcional)'}</label>
          <input id="imagen" name="imagen" type="file" accept="image/jpeg,image/png,image/webp" onChange={elegirImagen}
            className={clase('imagen')} aria-describedby={errores.imagen ? 'error-imagen' : 'ayuda-imagen'} />
          {error('imagen') || <div id="ayuda-imagen" className="form-text">JPG, PNG o WEBP de hasta 2 MB.</div>}
          {imagenActual && (
            <img src={imagenActual} alt="Vista previa de la foto" className="vista-previa-imagen mt-2 rounded" />
          )}
        </div>
      </div>

      <button type="submit" className="btn btn-primary mt-4 w-100" disabled={enviando}>
        {enviando ? 'Guardando…' : textoBoton}
      </button>
    </form>
  );
}
