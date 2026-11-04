const pesos = new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 });

export const formatearPrecio = (monto) => pesos.format(monto);

export const formatearFecha = (iso) =>
  new Date(iso).toLocaleDateString('es-CL', { day: 'numeric', month: 'long', year: 'numeric' });

const CONDICIONES = { nuevo: 'Nuevo', como_nuevo: 'Como nuevo', usado: 'Usado' };
export const nombreCondicion = (condicion) => CONDICIONES[condicion] ?? condicion;
