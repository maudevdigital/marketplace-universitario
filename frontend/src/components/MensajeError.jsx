// Estado de error: muestra el mensaje del backend y, si se puede, un botón para reintentar.
// error es un ErrorApi (src/services/api.js) o cualquier Error.
export default function MensajeError({ error, alReintentar }) {
  const sinConexion = error?.estado === 0;
  return (
    <div className="estado-pantalla" role="alert">
      <i className={`bi ${sinConexion ? 'bi-wifi-off' : 'bi-exclamation-triangle'} estado-icono text-danger`} aria-hidden="true" />
      <h2 className="h5 mt-3">{sinConexion ? 'Sin conexión con el servidor' : 'Algo salió mal'}</h2>
      <p className="text-muted mb-3">{error?.message ?? 'Ocurrió un error inesperado.'}</p>
      {alReintentar && (
        <button type="button" className="btn btn-outline-primary" onClick={alReintentar}>
          <i className="bi bi-arrow-clockwise me-1" aria-hidden="true" />
          Reintentar
        </button>
      )}
    </div>
  );
}
