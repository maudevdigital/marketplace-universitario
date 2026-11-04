import { useCallback, useEffect, useMemo, useState } from 'react';
import useSesion from '../hooks/useSesion';
import { listarFavoritos, marcarFavorito, quitarFavorito } from '../services/favoritos';
import { FavoritosContexto } from './contextos';

// Qué productos marcó como favoritos quien inició sesión (HU-09). Se comparte para que el
// corazón se vea igual en el catálogo, el detalle y la página de favoritos.
export default function FavoritosProvider({ children }) {
  const { usuario } = useSesion();
  // Se guarda de quién son los favoritos: al cambiar de cuenta, los anteriores dejan de valer.
  const [estado, setEstado] = useState({ usuarioId: null, ids: new Set() });

  useEffect(() => {
    if (!usuario) return undefined;
    let vigente = true;
    listarFavoritos()
      .then((productos) => vigente && setEstado({ usuarioId: usuario.id, ids: new Set(productos.map((p) => p.id)) }))
      .catch(() => undefined); // sin la lista, los corazones parten vacíos; la página de favoritos muestra el error
    return () => {
      vigente = false;
    };
  }, [usuario]);

  const ids = usuario && estado.usuarioId === usuario.id ? estado.ids : null;

  const cambiarId = useCallback(
    (productoId, marcado) =>
      setEstado((actual) => {
        const siguientes = new Set(actual.usuarioId === usuario?.id ? actual.ids : []);
        if (marcado) siguientes.add(productoId);
        else siguientes.delete(productoId);
        return { usuarioId: usuario?.id ?? null, ids: siguientes };
      }),
    [usuario],
  );

  const esFavorito = useCallback((productoId) => Boolean(ids?.has(productoId)), [ids]);

  // Cambia el corazón al instante y lo devuelve a como estaba si el backend falla.
  const alternar = useCallback(
    async (productoId) => {
      const marcar = !esFavorito(productoId);
      cambiarId(productoId, marcar);
      try {
        await (marcar ? marcarFavorito(productoId) : quitarFavorito(productoId));
        return marcar;
      } catch (error) {
        cambiarId(productoId, !marcar);
        throw error;
      }
    },
    [esFavorito, cambiarId],
  );

  const valor = useMemo(() => ({ esFavorito, alternar }), [esFavorito, alternar]);

  return <FavoritosContexto.Provider value={valor}>{children}</FavoritosContexto.Provider>;
}
