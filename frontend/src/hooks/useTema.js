import { useEffect, useState } from 'react';

const CLAVE = 'unimarket.tema';

// Tema claro u oscuro, igual que en la Actividad 1: todo el trabajo lo hacen las
// variables de CSS; aquí solo se cambia el atributo data-tema de <html>.
// Es una preferencia de la interfaz, por eso sí se guarda en el navegador.
export default function useTema() {
  const [tema, setTema] = useState(() => {
    const guardado = localStorage.getItem(CLAVE);
    if (guardado) return guardado;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'oscuro' : 'claro';
  });

  useEffect(() => {
    document.documentElement.dataset.tema = tema;
    // Bootstrap 5.3 también adapta sus componentes con data-bs-theme
    document.documentElement.dataset.bsTheme = tema === 'oscuro' ? 'dark' : 'light';
    localStorage.setItem(CLAVE, tema);
  }, [tema]);

  const alternar = () => setTema((actual) => (actual === 'oscuro' ? 'claro' : 'oscuro'));

  return { tema, alternar };
}
