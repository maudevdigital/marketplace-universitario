// HU-13: cuándo se envió un mensaje, en el formato más útil según cuánto tiempo pasó:
// «hace un momento», «hace 5 min», «14:05» (hoy), «ayer 14:05» o «3 nov 14:05».
export function formatearMomento(iso) {
  const fecha = new Date(iso);
  const ahora = new Date();
  const minutos = Math.floor((ahora - fecha) / 60_000);
  const hora = fecha.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' });

  if (minutos < 1) return 'hace un momento';
  if (minutos < 60) return `hace ${minutos} min`;

  const mismoDia = (a, b) => a.toDateString() === b.toDateString();
  if (mismoDia(fecha, ahora)) return hora;
  const ayer = new Date(ahora);
  ayer.setDate(ahora.getDate() - 1);
  if (mismoDia(fecha, ayer)) return `ayer ${hora}`;
  return `${fecha.toLocaleDateString('es-CL', { day: 'numeric', month: 'short' })} ${hora}`;
}
