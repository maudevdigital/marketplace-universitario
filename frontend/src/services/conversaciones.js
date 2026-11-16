import { pedir } from './api';

// HU-13: mensajes entre comprador y vendedor (se guardan en MongoDB).

export const listarConversaciones = () => pedir('/conversaciones');

export const contarNoLeidos = () => pedir('/conversaciones/no-leidos');

export const obtenerConversacion = (id) => pedir(`/conversaciones/${id}`);

// Si ya existía una conversación por ese producto, el backend suma el mensaje a la misma.
export const preguntarPorProducto = (productoId, texto) =>
  pedir('/conversaciones', { metodo: 'POST', cuerpo: { productoId, texto } });

export const responderConversacion = (id, texto) =>
  pedir(`/conversaciones/${id}/mensajes`, { metodo: 'POST', cuerpo: { texto } });

// Avisa al menú que cambió la cantidad de mensajes sin leer (al abrir una conversación).
export const avisarMensajesLeidos = () => window.dispatchEvent(new Event('mensajes-leidos'));
