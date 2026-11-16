// Estado de carga: se muestra mientras llega la respuesta del backend.
export default function Cargando({ texto = 'Cargando…' }) {
  return (
    <div className="estado-pantalla" role="status">
      <div className="spinner-border text-primary" aria-hidden="true" />
      <p className="mt-3 mb-0 text-muted">{texto}</p>
    </div>
  );
}
