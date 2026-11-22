// Paleta de la Actividad 1 y del frontend web (frontend/src/styles/tema.css).
export const colores = {
  primario: '#6366f1',
  primarioOscuro: '#4f46e5',
  primarioClaro: '#818cf8',
  exito: '#10b981',
  peligro: '#ef4444',
  aviso: '#f59e0b',
  fondo: '#ffffff',
  fondoSuave: '#f9fafb',
  texto: '#1f2937',
  textoSuave: '#6b7280',
  borde: '#e5e7eb',
};

// $130.000
export const formatearPrecio = (valor) => `$${String(valor).replace(/\B(?=(\d{3})+(?!\d))/g, '.')}`;

// 04-11-2026
export function formatearFecha(texto) {
  const fecha = new Date(texto);
  const dos = (n) => String(n).padStart(2, '0');
  return `${dos(fecha.getDate())}-${dos(fecha.getMonth() + 1)}-${fecha.getFullYear()}`;
}

export const CONDICIONES = [
  { valor: 'nuevo', texto: 'Nuevo' },
  { valor: 'como_nuevo', texto: 'Como nuevo' },
  { valor: 'usado', texto: 'Usado' },
];

export const ESTADOS_PRODUCTO = {
  activo: { texto: 'Activa', color: colores.exito },
  pausado: { texto: 'Pausada', color: colores.textoSuave },
  agotado: { texto: 'Agotada', color: colores.aviso },
  eliminado: { texto: 'Archivada', color: colores.textoSuave },
};

export const ESTADOS_PEDIDO = {
  pendiente: { texto: 'Pendiente de pago', color: colores.aviso },
  pagado: { texto: 'Pagado', color: colores.primario },
  entregado: { texto: 'Entregado', color: colores.exito },
  cancelado: { texto: 'Cancelado', color: colores.textoSuave },
};
