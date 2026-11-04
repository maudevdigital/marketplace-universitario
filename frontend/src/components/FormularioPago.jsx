import { useState } from 'react';

// Formulario de pago simulado (HU-12). Los datos de la tarjeta solo viajan al backend para
// validarse: no se guardan en ninguna parte.
function validar({ numeroTarjeta, titular, vencimiento, cvv }) {
  const errores = {};
  if (!/^\d{16}$/.test(numeroTarjeta.replace(/\s/g, ''))) errores.numeroTarjeta = 'El número debe tener 16 dígitos.';
  if (titular.trim().length < 3) errores.titular = 'Escribe el nombre como aparece en la tarjeta.';
  if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(vencimiento)) errores.vencimiento = 'Usa el formato MM/AA.';
  if (!/^\d{3,4}$/.test(cvv)) errores.cvv = 'Debe tener 3 o 4 dígitos.';
  return errores;
}

// 4242424242424242 → «4242 4242 4242 4242» mientras se escribe.
const conEspacios = (texto) => texto.replace(/\D/g, '').slice(0, 16).replace(/(\d{4})(?=\d)/g, '$1 ');
const comoVencimiento = (texto) => {
  const digitos = texto.replace(/\D/g, '').slice(0, 4);
  return digitos.length > 2 ? `${digitos.slice(0, 2)}/${digitos.slice(2)}` : digitos;
};

export default function FormularioPago({ total, alPagar }) {
  const [valores, setValores] = useState({ numeroTarjeta: '', titular: '', vencimiento: '', cvv: '' });
  const [errores, setErrores] = useState({});
  const [enviando, setEnviando] = useState(false);

  const cambiar = (evento) => {
    const { name, value } = evento.target;
    const formateado = {
      numeroTarjeta: conEspacios(value),
      vencimiento: comoVencimiento(value),
      cvv: value.replace(/\D/g, '').slice(0, 4),
    }[name] ?? value;
    setValores({ ...valores, [name]: formateado });
  };

  const enviar = async (evento) => {
    evento.preventDefault();
    const encontrados = validar(valores);
    setErrores(encontrados);
    if (Object.keys(encontrados).length > 0) return;
    setEnviando(true);
    try {
      await alPagar({ ...valores, numeroTarjeta: valores.numeroTarjeta.replace(/\s/g, '') });
    } finally {
      setEnviando(false);
    }
  };

  const campo = (nombre, etiqueta, propiedades) => (
    <div className={propiedades.columna ?? 'col-12'}>
      <label htmlFor={`pago-${nombre}`} className="form-label small">{etiqueta}</label>
      <input
        id={`pago-${nombre}`} name={nombre} value={valores[nombre]} onChange={cambiar}
        className={`form-control ${errores[nombre] ? 'is-invalid' : ''}`}
        aria-describedby={errores[nombre] ? `error-pago-${nombre}` : undefined}
        {...propiedades.input}
      />
      {errores[nombre] && <div id={`error-pago-${nombre}`} className="invalid-feedback">{errores[nombre]}</div>}
    </div>
  );

  return (
    <form onSubmit={enviar} noValidate>
      <div className="alert alert-info small py-2">
        <strong>Pago simulado.</strong> Usa <code>4242 4242 4242 4242</code> para aprobar o{' '}
        <code>4000 0000 0000 0002</code> para ver un rechazo. Vencimiento futuro y cualquier código.
      </div>
      <div className="row g-2">
        {campo('numeroTarjeta', 'Número de tarjeta', { input: { inputMode: 'numeric', autoComplete: 'cc-number', placeholder: '4242 4242 4242 4242' } })}
        {campo('titular', 'Titular', { input: { autoComplete: 'cc-name', maxLength: 80 } })}
        {campo('vencimiento', 'Vencimiento', { columna: 'col-6', input: { inputMode: 'numeric', autoComplete: 'cc-exp', placeholder: 'MM/AA' } })}
        {campo('cvv', 'Código', { columna: 'col-6', input: { inputMode: 'numeric', autoComplete: 'cc-csc', placeholder: '123' } })}
      </div>
      <button type="submit" className="btn btn-primary w-100 mt-3" disabled={enviando}>
        <i className="bi bi-lock me-2" aria-hidden="true" />
        {enviando ? 'Procesando pago…' : `Pagar ${total}`}
      </button>
    </form>
  );
}
