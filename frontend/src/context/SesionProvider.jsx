import { useCallback, useEffect, useMemo, useState } from 'react';
import { borrarToken, guardarToken, leerToken } from '../services/api';
import * as auth from '../services/auth';
import { SesionContexto } from './contextos';

// Guarda quién inició sesión y lo comparte con toda la aplicación.
// Al abrir la página, si hay un token guardado, pregunta al backend quién es (/auth/yo).
export default function SesionProvider({ children }) {
  const [usuario, setUsuario] = useState(null);
  const [cargando, setCargando] = useState(() => Boolean(leerToken()));

  useEffect(() => {
    if (!leerToken()) return;
    auth
      .obtenerUsuarioActual()
      .then(setUsuario)
      .catch(() => borrarToken())
      .finally(() => setCargando(false));
  }, []);

  // pedir() avisa con este evento cuando el backend responde 401 (token vencido).
  useEffect(() => {
    const alExpirar = () => setUsuario(null);
    window.addEventListener('sesion-expirada', alExpirar);
    return () => window.removeEventListener('sesion-expirada', alExpirar);
  }, []);

  const iniciar = useCallback(({ token, usuario: datos }) => {
    guardarToken(token);
    setUsuario(datos);
  }, []);

  const ingresar = useCallback(
    async (correo, contrasena) => iniciar(await auth.ingresar(correo, contrasena)),
    [iniciar],
  );

  const registrar = useCallback(async (datos) => iniciar(await auth.registrar(datos)), [iniciar]);

  const salir = useCallback(() => {
    borrarToken();
    setUsuario(null);
  }, []);

  const valor = useMemo(
    () => ({ usuario, cargando, ingresar, registrar, salir }),
    [usuario, cargando, ingresar, registrar, salir],
  );

  return <SesionContexto.Provider value={valor}>{children}</SesionContexto.Provider>;
}
