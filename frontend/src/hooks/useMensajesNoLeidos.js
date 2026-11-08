import { useEffect, useState } from 'react';
import { contarNoLeidos } from '../services/conversaciones';

const CADA = 30_000; // vuelve a preguntar cada 30 segundos

// HU-13: cantidad de mensajes sin leer, para el número rojo junto a «Mensajes» en el menú.
// Se actualiza sola cada 30 segundos y al instante cuando se abre una conversación.
export default function useMensajesNoLeidos(usuario) {
  const [total, setTotal] = useState(0);

  useEffect(() => {
    if (!usuario) return undefined;
    let vigente = true;
    const actualizar = () =>
      contarNoLeidos()
        .then((respuesta) => vigente && setTotal(respuesta.total))
        .catch(() => {}); // si falla, se deja el último número conocido: no vale la pena un error aquí
    actualizar();
    const intervalo = setInterval(actualizar, CADA);
    window.addEventListener('mensajes-leidos', actualizar);
    return () => {
      vigente = false;
      clearInterval(intervalo);
      window.removeEventListener('mensajes-leidos', actualizar);
    };
  }, [usuario]);

  return usuario ? total : 0;
}
