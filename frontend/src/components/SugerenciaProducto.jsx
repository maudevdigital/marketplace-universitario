import { useEffect, useRef, useState } from 'react';
import { sugerirProducto } from '../services/sugerencias';
import './sugerencia.css';

const ESPERA = 700; // milisegundos sin escribir antes de consultar
const LARGO_MINIMO = 4;

/**
 * HU-08: mientras el vendedor escribe el título, pregunta a Mercado Libre (a través de nuestro
 * backend) qué producto es. Muestra la categoría, la marca y el modelo reconocidos, y con
 * «Usar sugerencia» los copia al formulario. El vendedor siempre puede corregirlos a mano.
 * Nunca bloquea el formulario: si Mercado Libre no responde, solo muestra un aviso.
 *
 * @param {string} titulo Título que se está escribiendo
 * @param {(cambios: object) => void} alAplicar Recibe los campos a reemplazar (categoriaId, marca, modelo)
 */
export default function SugerenciaProducto({ titulo, alAplicar }) {
  // Cada resultado recuerda para qué título fue: si el título cambió, el resultado ya no sirve.
  const [resultado, setResultado] = useState({ titulo: '', estado: 'nada' });
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
    // Si sigue escribiendo antes de 700 ms, se cancela y se espera de nuevo.
    return () => clearTimeout(temporizador);
  }, [tituloLimpio]);

  if (tituloLimpio.length < LARGO_MINIMO || resultado.titulo !== tituloLimpio) return null;

  if (resultado.estado === 'buscando') {
    return (
      <p className="sugerencia sugerencia-buscando small" role="status">
        <span className="spinner-border spinner-border-sm me-2" aria-hidden="true" />
        Buscando sugerencias en Mercado Libre…
      </p>
    );
  }

  if (resultado.estado === 'error') {
    return (
      <p className="sugerencia sugerencia-aviso small" role="status">
        <i className="bi bi-cloud-slash me-2" aria-hidden="true" />
        {resultado.error.estado === 503
          ? resultado.error.message
          : 'No se pudieron cargar sugerencias. Completa los datos a mano.'}
      </p>
    );
  }

  const { sugerencia } = resultado;
  if (!sugerencia.encontrada) return null;

  // key: al cambiar de título, «Aplicada» vuelve a cero.
  return <PanelSugerencia key={tituloLimpio} sugerencia={sugerencia} alAplicar={alAplicar} />;
}

function PanelSugerencia({ sugerencia, alAplicar }) {
  const [aplicada, setAplicada] = useState(false);
  const { categoria, categoriaMercadoLibre: ml, marca, modelo } = sugerencia;

  const aplicar = () => {
    alAplicar({
      ...(categoria && { categoriaId: String(categoria.id) }),
      ...(marca && { marca }),
      ...(modelo && { modelo }),
    });
    setAplicada(true);
  };

  return (
    <div className="sugerencia sugerencia-lista small" role="region" aria-label="Sugerencia de Mercado Libre">
      <p className="mb-0">
        <i className="bi bi-stars me-1" aria-hidden="true" />
        Mercado Libre lo reconoce como <strong>{ml.nombre}</strong>.
        {categoria && <> Categoría: <strong>{categoria.nombre}</strong>.</>}
        {marca && <> Marca: <strong>{marca}</strong>.</>}
        {modelo && <> Modelo: <strong>{modelo}</strong>.</>}
      </p>
      {aplicada ? (
        <span className="text-success text-nowrap">
          <i className="bi bi-check-circle me-1" aria-hidden="true" />Aplicada
        </span>
      ) : (
        <button type="button" className="btn btn-sm btn-primary text-nowrap" onClick={aplicar}>
          Usar sugerencia
        </button>
      )}
    </div>
  );
}
