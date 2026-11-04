import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Carga datos del backend y entrega los estados que toda pantalla necesita mostrar.
 *
 *   const { datos, cargando, error, recargar } = usePeticion(listarCategorias);
 *   const { datos } = usePeticion(() => obtenerPerfil(id), [id]);
 *
 * @param {() => Promise<any>} funcion Llamada a un servicio de src/services
 * @param {any[]} dependencias Cuándo volver a cargar (como en useEffect)
 */
export default function usePeticion(funcion, dependencias = []) {
  const [intento, setIntento] = useState(0);
  // Cada combinación de dependencias + intento es una petición distinta.
  const clave = JSON.stringify([...dependencias, intento]);
  const [resultado, setResultado] = useState({ clave: null, datos: null, error: null });

  // Siempre la versión más reciente de la función, sin volver a pedir en cada render.
  const funcionActual = useRef(funcion);
  useEffect(() => {
    funcionActual.current = funcion;
  });

  useEffect(() => {
    // Si la pantalla cambia antes de que llegue la respuesta, esa respuesta se ignora.
    let vigente = true;
    funcionActual
      .current()
      .then((datos) => vigente && setResultado({ clave, datos, error: null }))
      .catch((error) => vigente && setResultado({ clave, datos: null, error }));
    return () => {
      vigente = false;
    };
  }, [clave]);

  // Está cargando mientras la última respuesta no corresponda a la petición actual.
  const cargando = resultado.clave !== clave;

  const recargar = useCallback(() => setIntento((n) => n + 1), []);

  // Para actualizar la lista en pantalla después de una acción, sin volver a pedirla.
  const setDatos = useCallback(
    (nuevos) =>
      setResultado((actual) => ({
        ...actual,
        datos: typeof nuevos === 'function' ? nuevos(actual.datos) : nuevos,
      })),
    [],
  );

  return {
    datos: resultado.datos,
    error: cargando ? null : resultado.error,
    cargando,
    recargar,
    setDatos,
  };
}
