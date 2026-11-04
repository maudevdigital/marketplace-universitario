import { Link } from 'react-router-dom';
import EstadoVacio from '../components/EstadoVacio';

export default function NoEncontrada() {
  return (
    <section className="container py-5">
      <EstadoVacio icono="signpost-split" titulo="Página no encontrada" texto="La dirección no existe o fue movida.">
        <Link to="/" className="btn btn-primary">Volver al inicio</Link>
      </EstadoVacio>
    </section>
  );
}
