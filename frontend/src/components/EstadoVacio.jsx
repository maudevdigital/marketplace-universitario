// Estado vacío: la petición funcionó, pero no hay nada que mostrar.
// children sirve para agregar una acción, por ejemplo un enlace a «Publicar».
export default function EstadoVacio({ icono = 'inbox', titulo, texto, children }) {
  return (
    <div className="estado-pantalla">
      <i className={`bi bi-${icono} estado-icono text-muted`} aria-hidden="true" />
      <h2 className="h5 mt-3">{titulo}</h2>
      {texto && <p className="text-muted mb-3">{texto}</p>}
      {children}
    </div>
  );
}
