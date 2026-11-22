import { createContext, useCallback, useEffect, useMemo, useState } from 'react';
import { AppState } from 'react-native';
import { contarNoLeidos, obtenerCarrito } from '../services/servicios';

export const ContadoresContext = createContext({ unidadesCarrito: 0, noLeidos: 0, actualizar: () => {} });

const CADA = 30_000; // igual que el número rojo de «Mensajes» en la web

const leerContadores = () =>
  Promise.all([obtenerCarrito(), contarNoLeidos()]).then(([carrito, mensajes]) => ({
    unidadesCarrito: carrito.unidades,
    noLeidos: mensajes.total,
  }));

// Los números de las pestañas: unidades en el carrito y mensajes sin leer.
// Se piden al abrir, cada 30 segundos, al volver a la aplicación y cuando una pantalla
// avisa que algo cambió (agregar al carrito, comprar, leer una conversación).
// activo: solo hay números que pedir cuando alguien inició sesión.
export function ContadoresProvider({ activo, children }) {
  const [contadores, setContadores] = useState({ unidadesCarrito: 0, noLeidos: 0 });

  // Un número desactualizado no debe interrumpir a nadie: si falla, se reintenta en la próxima vuelta.
  const actualizar = useCallback(
    () => (activo ? leerContadores().then(setContadores).catch(() => undefined) : Promise.resolve()),
    [activo],
  );

  useEffect(() => {
    if (!activo) return undefined;
    const refrescar = () => leerContadores().then(setContadores).catch(() => undefined);
    refrescar();
    const intervalo = setInterval(refrescar, CADA);
    const suscripcion = AppState.addEventListener('change', (estado) => estado === 'active' && refrescar());
    return () => {
      clearInterval(intervalo);
      suscripcion.remove();
    };
  }, [activo]);

  const valor = useMemo(() => ({ ...contadores, actualizar }), [contadores, actualizar]);
  return <ContadoresContext.Provider value={valor}>{children}</ContadoresContext.Provider>;
}
