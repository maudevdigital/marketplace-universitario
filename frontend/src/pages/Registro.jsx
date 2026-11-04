import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import useAvisos from '../hooks/useAvisos';
import useSesion from '../hooks/useSesion';

// Mismas reglas que valida el backend (RegistroDto). Se repiten aquí para avisar
// antes de enviar, pero la validación que manda es la del backend.
function validar({ nombre, correo, contrasena, confirmacion }) {
  const errores = {};
  if (nombre.trim().length < 2) errores.nombre = 'El nombre debe tener al menos 2 caracteres.';
  if (!/^\S+@\S+\.\S+$/.test(correo.trim())) errores.correo = 'El correo no es válido.';
  if (contrasena.length < 8) errores.contrasena = 'La contraseña debe tener al menos 8 caracteres.';
  else if (!/[A-Za-z]/.test(contrasena) || !/\d/.test(contrasena)) {
    errores.contrasena = 'La contraseña debe tener al menos una letra y un número.';
  }
  if (confirmacion !== contrasena) errores.confirmacion = 'Las contraseñas no coinciden.';
  return errores;
}

const CAMPOS = [
  { nombre: 'nombre', etiqueta: 'Nombre', tipo: 'text', autocompletar: 'name' },
  { nombre: 'correo', etiqueta: 'Correo', tipo: 'email', autocompletar: 'email' },
  { nombre: 'carrera', etiqueta: 'Carrera (opcional)', tipo: 'text', autocompletar: 'off' },
  { nombre: 'contrasena', etiqueta: 'Contraseña', tipo: 'password', autocompletar: 'new-password', ayuda: 'Al menos 8 caracteres, con una letra y un número.' },
  { nombre: 'confirmacion', etiqueta: 'Repite la contraseña', tipo: 'password', autocompletar: 'new-password' },
];

export default function Registro() {
  const { usuario, registrar } = useSesion();
  const { mostrarAviso } = useAvisos();
  const navegar = useNavigate();
  const ubicacion = useLocation();
  const destino = ubicacion.state?.desde ?? '/';

  const [valores, setValores] = useState({ nombre: '', correo: '', carrera: '', contrasena: '', confirmacion: '' });
  const [errores, setErrores] = useState({});
  const [errorGeneral, setErrorGeneral] = useState('');
  const [enviando, setEnviando] = useState(false);

  if (usuario) return <Navigate to={destino} replace />;

  const cambiar = (evento) => setValores({ ...valores, [evento.target.name]: evento.target.value });

  const enviar = async (evento) => {
    evento.preventDefault();
    const encontrados = validar(valores);
    setErrores(encontrados);
    if (Object.keys(encontrados).length > 0) return;

    setEnviando(true);
    setErrorGeneral('');
    try {
      // La confirmación solo se usa aquí: el backend no la recibe.
      const { nombre, correo, contrasena, carrera } = valores;
      await registrar({ nombre, correo, contrasena, carrera: carrera.trim() || undefined });
      mostrarAviso('Tu cuenta quedó creada.', 'exito');
      navegar(destino, { replace: true });
    } catch (error) {
      setErrorGeneral(error.message);
    } finally {
      setEnviando(false);
    }
  };

  return (
    <section className="container py-5 formulario-angosto">
      <h1 className="h3 mb-1">Crear cuenta</h1>
      <p className="text-muted mb-4">Con una sola cuenta puedes comprar y vender.</p>
      {errorGeneral && <div className="alert alert-danger" role="alert">{errorGeneral}</div>}

      <form onSubmit={enviar} noValidate>
        {CAMPOS.map((campo) => {
          const error = errores[campo.nombre];
          const idAyuda = `ayuda-${campo.nombre}`;
          return (
            <div className="mb-3" key={campo.nombre}>
              <label htmlFor={campo.nombre} className="form-label">{campo.etiqueta}</label>
              <input
                id={campo.nombre} name={campo.nombre} type={campo.tipo} autoComplete={campo.autocompletar}
                className={`form-control ${error ? 'is-invalid' : ''}`}
                value={valores[campo.nombre]} onChange={cambiar}
                aria-describedby={error || campo.ayuda ? idAyuda : undefined}
              />
              {error ? (
                <div id={idAyuda} className="invalid-feedback">{error}</div>
              ) : (
                campo.ayuda && <div id={idAyuda} className="form-text">{campo.ayuda}</div>
              )}
            </div>
          );
        })}
        <button type="submit" className="btn btn-primary w-100 mt-2" disabled={enviando}>
          {enviando ? 'Creando cuenta…' : 'Crear cuenta'}
        </button>
      </form>

      <p className="mt-4 text-center small">
        ¿Ya tienes cuenta? <Link to="/ingresar" state={ubicacion.state}>Inicia sesión</Link>
      </p>
    </section>
  );
}
