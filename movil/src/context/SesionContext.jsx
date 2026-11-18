import { createContext, useCallback, useEffect, useMemo, useState } from 'react';
import { borrarToken, cuandoExpireLaSesion, guardarToken, leerToken } from '../services/api';
import * as api from '../services/servicios';

export const SesionContext = createContext(null);

// Guarda quién inició sesión. Al abrir la aplicación revisa si había un token guardado y si
// sigue vigente (GET /auth/yo); si venció, la persona vuelve a la pantalla de ingreso.
export function SesionProvider({ children }) {
  const [usuario, setUsuario] = useState(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    cuandoExpireLaSesion(() => setUsuario(null));
    (async () => {
      try {
        if (await leerToken()) setUsuario(await api.obtenerUsuarioActual());
      } catch {
        await borrarToken();
      } finally {
        setCargando(false);
      }
    })();
  }, []);

  // Ingresar y crear cuenta responden igual: { token, usuario }.
  const iniciar = useCallback(async ({ token, usuario: datos }) => {
    await guardarToken(token);
    setUsuario(datos);
  }, []);

  const ingresar = useCallback(async (correo, contrasena) => iniciar(await api.ingresar(correo, contrasena)), [iniciar]);
  const registrar = useCallback(async (datos) => iniciar(await api.registrar(datos)), [iniciar]);

  const salir = useCallback(async () => {
    await borrarToken();
    setUsuario(null);
  }, []);

  const valor = useMemo(
    () => ({ usuario, cargando, ingresar, registrar, salir }),
    [usuario, cargando, ingresar, registrar, salir],
  );
  return <SesionContext.Provider value={valor}>{children}</SesionContext.Provider>;
}
