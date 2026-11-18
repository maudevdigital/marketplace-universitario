import { useFocusEffect } from 'expo-router';
import { useCallback, useRef } from 'react';

// Las pestañas no se desmontan al cambiar de una a otra. Esto vuelve a pedir los datos cada vez
// que la persona regresa a la pantalla (por ejemplo, Favoritos después de marcar uno en el detalle).
// La primera vez no hace nada, porque usePeticion ya cargó al abrir la pantalla.
export default function useRecargarAlVolver(recargar) {
  const primeraVez = useRef(true);
  useFocusEffect(
    useCallback(() => {
      if (primeraVez.current) {
        primeraVez.current = false;
        return;
      }
      recargar();
    }, [recargar]),
  );
}
