// Botones «anterior / siguiente» con la página actual. No se muestra si hay una sola página.
export default function Paginacion({ pagina, totalPaginas, alCambiar }) {
  if (totalPaginas <= 1) return null;

  const ir = (destino) => {
    alCambiar(destino);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <nav className="d-flex justify-content-center align-items-center gap-3 mt-4" aria-label="Páginas del catálogo">
      <button type="button" className="btn btn-outline-primary btn-sm" disabled={pagina <= 1} onClick={() => ir(pagina - 1)}>
        <i className="bi bi-chevron-left me-1" aria-hidden="true" />Anterior
      </button>
      <span className="small">Página {pagina} de {totalPaginas}</span>
      <button type="button" className="btn btn-outline-primary btn-sm" disabled={pagina >= totalPaginas} onClick={() => ir(pagina + 1)}>
        Siguiente<i className="bi bi-chevron-right ms-1" aria-hidden="true" />
      </button>
    </nav>
  );
}
