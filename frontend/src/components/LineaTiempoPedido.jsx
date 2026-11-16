import { formatearFecha, formatearPrecio } from '../utils/formato';

const PASOS = [
  { estado: 'pendiente', texto: 'Pedido creado', icono: 'receipt' },
  { estado: 'pagado', texto: 'Pagado', icono: 'credit-card' },
  { estado: 'entregado', texto: 'Entregado', icono: 'box-seam' },
];

// Avance del pedido (pendiente → pagado → entregado) y el historial de intentos de pago (HU-12).
export default function LineaTiempoPedido({ pedido }) {
  const cancelado = pedido.estado === 'cancelado';
  const alcanzado = PASOS.findIndex((paso) => paso.estado === pedido.estado);
  // Si se canceló, se muestra hasta dónde llegó: pagado si hay un pago aprobado.
  const ultimo = cancelado ? (pedido.pagos.some((pago) => pago.estado === 'aprobado') ? 1 : 0) : alcanzado;

  return (
    <div className="card">
      <div className="card-body">
        <h2 className="h6 mb-3">Seguimiento</h2>
        <ol className="linea-tiempo list-unstyled mb-0">
          {PASOS.map((paso, indice) => (
            <li key={paso.estado} className={indice <= ultimo ? 'hecho' : ''}>
              <i className={`bi bi-${paso.icono}`} aria-hidden="true" />
              <span>{paso.texto}</span>
              <span className="visually-hidden">{indice <= ultimo ? '(completado)' : '(pendiente)'}</span>
            </li>
          ))}
          {cancelado && (
            <li className="cancelado">
              <i className="bi bi-x-circle" aria-hidden="true" />
              <span>Cancelado el {formatearFecha(pedido.actualizadoEn)}</span>
            </li>
          )}
        </ol>

        {pedido.pagos.length > 0 && (
          <>
            <h3 className="h6 mt-4 mb-2">Pagos</h3>
            <ul className="list-unstyled small mb-0 d-grid gap-1">
              {pedido.pagos.map((pago) => (
                <li key={pago.id} className="d-flex justify-content-between gap-2">
                  <span>
                    <i className={`bi ${pago.estado === 'aprobado' ? 'bi-check-circle text-success' : 'bi-x-circle text-danger'} me-1`} aria-hidden="true" />
                    {pago.estado === 'aprobado' ? 'Aprobado' : 'Rechazado'} · <code>{pago.comprobante}</code>
                  </span>
                  <span className="text-muted">{formatearPrecio(pago.monto)}</span>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </div>
  );
}
