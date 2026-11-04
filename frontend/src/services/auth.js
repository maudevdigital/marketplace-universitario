import { pedir } from './api';

export const registrar = (datos) => pedir('/auth/registro', { metodo: 'POST', cuerpo: datos });

export const ingresar = (correo, contrasena) =>
  pedir('/auth/ingreso', { metodo: 'POST', cuerpo: { correo, contrasena } });

export const obtenerUsuarioActual = () => pedir('/auth/yo');
