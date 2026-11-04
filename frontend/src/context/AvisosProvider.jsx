import { useCallback, useMemo, useState } from 'react';
import { AvisosContexto } from './contextos';

const DURACION = 4000;
const ICONOS = { exito: 'check-circle-fill', error: 'exclamation-triangle-fill', info: 'info-circle-fill' };

// Mensajes breves de confirmación o error («Producto publicado», «No quedan unidades»…).
// Uso: const { mostrarAviso } = useAvisos(); mostrarAviso('Producto publicado', 'exito');
export default function AvisosProvider({ children }) {
  const [avisos, setAvisos] = useState([]);

  const cerrar = useCallback((id) => setAvisos((lista) => lista.filter((aviso) => aviso.id !== id)), []);

  const mostrarAviso = useCallback(
    (texto, tipo = 'info') => {
      const id = crypto.randomUUID();
      setAvisos((lista) => [...lista, { id, texto, tipo }]);
      setTimeout(() => cerrar(id), DURACION);
    },
    [cerrar],
  );

  const valor = useMemo(() => ({ mostrarAviso }), [mostrarAviso]);

  return (
    <AvisosContexto.Provider value={valor}>
      {children}
      {/* aria-live: los lectores de pantalla anuncian cada aviso nuevo */}
      <div className="avisos" aria-live="polite">
        {avisos.map((aviso) => (
          <div key={aviso.id} className={`aviso aviso-${aviso.tipo}`} role="status">
            <i className={`bi bi-${ICONOS[aviso.tipo]}`} aria-hidden="true" />
            <span>{aviso.texto}</span>
            <button type="button" className="btn-close btn-sm ms-auto" aria-label="Cerrar aviso" onClick={() => cerrar(aviso.id)} />
          </div>
        ))}
      </div>
    </AvisosContexto.Provider>
  );
}
