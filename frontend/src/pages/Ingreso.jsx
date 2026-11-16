import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import useAvisos from '../hooks/useAvisos';
import useSesion from '../hooks/useSesion';

export default function Ingreso() {
  const { usuario, ingresar } = useSesion();
  const { mostrarAviso } = useAvisos();
  const navegar = useNavigate();
  const ubicacion = useLocation();
  const destino = ubicacion.state?.desde ?? '/';

  const [campos, setCampos] = useState({ correo: '', contrasena: '' });
  const [errores, setErrores] = useState({});
  const [errorGeneral, setErrorGeneral] = useState('');
  const [enviando, setEnviando] = useState(false);

  if (usuario) return <Navigate to={destino} replace />;

  const cambiar = (evento) => setCampos({ ...campos, [evento.target.name]: evento.target.value });

  const enviar = async (evento) => {
    evento.preventDefault();
    const encontrados = {};
    if (!campos.correo.trim()) encontrados.correo = 'Escribe tu correo.';
    if (!campos.contrasena) encontrados.contrasena = 'Escribe tu contraseña.';
    setErrores(encontrados);
    if (Object.keys(encontrados).length > 0) return;

    setEnviando(true);
    setErrorGeneral('');
    try {
      await ingresar(campos.correo, campos.contrasena);
      mostrarAviso('¡Bienvenido de vuelta!', 'exito');
      navegar(destino, { replace: true });
    } catch (error) {
      setErrorGeneral(error.message);
    } finally {
      setEnviando(false);
    }
  };

  return (
    <section className="container py-5 formulario-angosto">
      <h1 className="h3 mb-4">Iniciar sesión</h1>
      {errorGeneral && <div className="alert alert-danger" role="alert">{errorGeneral}</div>}

      <form onSubmit={enviar} noValidate>
        <div className="mb-3">
          <label htmlFor="correo" className="form-label">Correo</label>
          <input
            id="correo" name="correo" type="email" autoComplete="email"
            className={`form-control ${errores.correo ? 'is-invalid' : ''}`}
            value={campos.correo} onChange={cambiar}
            aria-describedby={errores.correo ? 'error-correo' : undefined}
          />
          {errores.correo && <div id="error-correo" className="invalid-feedback">{errores.correo}</div>}
        </div>
        <div className="mb-4">
          <label htmlFor="contrasena" className="form-label">Contraseña</label>
          <input
            id="contrasena" name="contrasena" type="password" autoComplete="current-password"
            className={`form-control ${errores.contrasena ? 'is-invalid' : ''}`}
            value={campos.contrasena} onChange={cambiar}
            aria-describedby={errores.contrasena ? 'error-contrasena' : undefined}
          />
          {errores.contrasena && <div id="error-contrasena" className="invalid-feedback">{errores.contrasena}</div>}
        </div>
        <button type="submit" className="btn btn-primary w-100" disabled={enviando}>
          {enviando ? 'Ingresando…' : 'Ingresar'}
        </button>
      </form>

      <p className="mt-4 text-center small">
        ¿No tienes cuenta? <Link to="/registro" state={ubicacion.state}>Crear una</Link>
      </p>
    </section>
  );
}
