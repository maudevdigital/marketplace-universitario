// Etiqueta de color con el estado de un pedido.
const ESTADOS = {
  pendiente: { texto: 'Pendiente de pago', clase: 'text-bg-warning', icono: 'hourglass-split' },
  pagado: { texto: 'Pagado', clase: 'text-bg-primary', icono: 'credit-card' },
  entregado: { texto: 'Entregado', clase: 'text-bg-success', icono: 'check2-circle' },
  cancelado: { texto: 'Cancelado', clase: 'text-bg-secondary', icono: 'x-circle' },
};

export default function EstadoPedido({ estado }) {
  const datos = ESTADOS[estado] ?? { texto: estado, clase: 'text-bg-light', icono: 'question-circle' };
  return (
    <span className={`badge ${datos.clase}`}>
      <i className={`bi bi-${datos.icono} me-1`} aria-hidden="true" />
      {datos.texto}
    </span>
  );
}
