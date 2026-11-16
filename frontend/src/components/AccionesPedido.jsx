import { useState } from 'react';
import useAvisos from '../hooks/useAvisos';
import { cancelarPedido, marcarEntregado, obtenerPedido, pagarPedido } from '../services/pedidos';
import { formatearPrecio } from '../utils/formato';
import FormularioPago from './FormularioPago';

// Lo que cada persona puede hacer con el pedido según su estado (HU-12):
//   comprador: pagar si está pendiente · vendedor: marcar entregado si está pagado
//   ambos: cancelar si está pendiente o pagado (el stock vuelve a la publicación)
// El backend vuelve a revisar todo esto; aquí solo se esconden los botones que no corresponden.
export default function AccionesPedido({ pedido, alActualizar }) {
  const { mostrarAviso } = useAvisos();
  const [ocupado, setOcupado] = useState(false);
  const [errorPago, setErrorPago] = useState('');

  const soyComprador = pedido.miRol === 'comprador';
  const puedePagar = soyComprador && pedido.estado === 'pendiente';
  const puedeEntregar = !soyComprador && pedido.estado === 'pagado';
  const puedeCancelar = ['pendiente', 'pagado'].includes(pedido.estado);

  const ejecutar = async (accion, mensaje) => {
    setOcupado(true);
    try {
      alActualizar(await accion());
      mostrarAviso(mensaje, 'exito');
    } catch (error) {
      mostrarAviso(error.message, 'error');
    } finally {
      setOcupado(false);
    }
  };

  const pagar = async (datos) => {
    setErrorPago('');
    try {
      alActualizar(await pagarPedido(pedido.id, datos));
      mostrarAviso('Pago aprobado. El vendedor ya puede entregarte el pedido.', 'exito');
    } catch (error) {
      setErrorPago(error.message);
      // 402: el rechazo quedó registrado; se trae el pedido para mostrarlo en el historial de pagos.
      if (error.estado === 402) obtenerPedido(pedido.id).then(alActualizar).catch(() => undefined);
    }
  };

  const cancelar = () => {
    const aviso = pedido.estado === 'pagado' ? ' El pago simulado se considera devuelto.' : '';
    if (!window.confirm(`¿Cancelar el pedido #${pedido.id}? Las unidades vuelven a estar disponibles.${aviso}`)) return;
    ejecutar(() => cancelarPedido(pedido.id), 'El pedido quedó cancelado.');
  };

  if (!puedePagar && !puedeEntregar && !puedeCancelar) return null;

  return (
    <div className="card">
      <div className="card-body">
        {puedePagar && (
          <>
            <h2 className="h6 mb-3">Pagar el pedido</h2>
            {errorPago && <div className="alert alert-danger py-2 small" role="alert">{errorPago}</div>}
            <FormularioPago total={formatearPrecio(pedido.total)} alPagar={pagar} />
          </>
        )}
        {soyComprador && pedido.estado === 'pagado' && (
          <p className="small mb-3">Ya pagaste. Coordina la entrega con el vendedor; él la marcará cuando te lo entregue.</p>
        )}
        {!soyComprador && pedido.estado === 'pendiente' && (
          <p className="small mb-3">Esperando el pago del comprador. Cuando pague podrás marcar la entrega.</p>
        )}
        {puedeEntregar && (
          <button type="button" className="btn btn-success w-100 mb-2" disabled={ocupado}
            onClick={() => ejecutar(() => marcarEntregado(pedido.id), 'Marcaste el pedido como entregado.')}>
            <i className="bi bi-box-seam me-2" aria-hidden="true" />Marcar como entregado
          </button>
        )}
        {puedeCancelar && (
          <button type="button" className={`btn btn-outline-danger w-100 ${puedePagar ? 'mt-2' : ''}`} disabled={ocupado} onClick={cancelar}>
            Cancelar pedido
          </button>
        )}
      </div>
    </div>
  );
}
