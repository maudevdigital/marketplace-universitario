import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colores } from '../tema';
import { Alerta, Boton, Campo, Entrada } from './Formulario';

// Mismas reglas que el formulario de pago web y que PagarPedidoDto del backend.
function validar({ numeroTarjeta, titular, vencimiento, cvv }) {
  const errores = {};
  if (!/^\d{16}$/.test(numeroTarjeta.replace(/\s/g, ''))) errores.numeroTarjeta = 'El número debe tener 16 dígitos.';
  if (titular.trim().length < 3) errores.titular = 'Escribe el nombre como aparece en la tarjeta.';
  if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(vencimiento)) errores.vencimiento = 'Usa el formato MM/AA.';
  if (!/^\d{3,4}$/.test(cvv)) errores.cvv = 'Debe tener 3 o 4 dígitos.';
  return errores;
}

// 4242424242424242 → «4242 4242 4242 4242» · 1228 → «12/28»
const conEspacios = (texto) => texto.replace(/\D/g, '').slice(0, 16).replace(/(\d{4})(?=\d)/g, '$1 ');
const comoVencimiento = (texto) => {
  const digitos = texto.replace(/\D/g, '').slice(0, 4);
  return digitos.length > 2 ? `${digitos.slice(0, 2)}/${digitos.slice(2)}` : digitos;
};

/**
 * Pago simulado: no hay dinero real y los datos de la tarjeta no se guardan.
 * @param {string} total Total ya formateado
 * @param {(datos: object) => Promise<void>} alPagar Lanza ErrorApi si el pago se rechaza (402)
 */
export default function FormularioPago({ total, alPagar }) {
  const [valores, setValores] = useState({ numeroTarjeta: '', titular: '', vencimiento: '', cvv: '' });
  const [errores, setErrores] = useState({});
  const [errorGeneral, setErrorGeneral] = useState('');
  const [pagando, setPagando] = useState(false);

  const cambiar = (campo, transformar = (v) => v) => (valor) =>
    setValores((actuales) => ({ ...actuales, [campo]: transformar(valor) }));

  const pagar = async () => {
    const encontrados = validar(valores);
    setErrores(encontrados);
    setErrorGeneral('');
    if (Object.keys(encontrados).length > 0) return;
    setPagando(true);
    try {
      await alPagar({ ...valores, titular: valores.titular.trim(), numeroTarjeta: valores.numeroTarjeta.replace(/\s/g, '') });
    } catch (e) {
      setErrorGeneral(e.message);
    } finally {
      setPagando(false);
    }
  };

  return (
    <View style={estilos.caja}>
      <Text style={estilos.titulo}>Pagar {total}</Text>
      <Text style={estilos.suave}>
        Pago simulado. Tarjeta de prueba aprobada: 4242 4242 4242 4242 · rechazada: 4000 0000 0000 0002.
      </Text>
      <Alerta texto={errorGeneral} />
      <Campo etiqueta="Número de tarjeta" error={errores.numeroTarjeta}>
        <Entrada invalido={errores.numeroTarjeta} value={valores.numeroTarjeta} onChangeText={cambiar('numeroTarjeta', conEspacios)}
          keyboardType="number-pad" placeholder="4242 4242 4242 4242" textContentType="creditCardNumber" />
      </Campo>
      <Campo etiqueta="Titular" error={errores.titular}>
        <Entrada invalido={errores.titular} value={valores.titular} onChangeText={cambiar('titular')} maxLength={80}
          autoCapitalize="words" textContentType="name" />
      </Campo>
      <View style={{ flexDirection: 'row', gap: 10 }}>
        <View style={{ flex: 1 }}>
          <Campo etiqueta="Vencimiento" error={errores.vencimiento}>
            <Entrada invalido={errores.vencimiento} value={valores.vencimiento} onChangeText={cambiar('vencimiento', comoVencimiento)}
              keyboardType="number-pad" placeholder="MM/AA" />
          </Campo>
        </View>
        <View style={{ flex: 1 }}>
          <Campo etiqueta="Código" error={errores.cvv}>
            <Entrada invalido={errores.cvv} value={valores.cvv} onChangeText={cambiar('cvv', (v) => v.replace(/\D/g, '').slice(0, 4))}
              keyboardType="number-pad" placeholder="123" secureTextEntry />
          </Campo>
        </View>
      </View>
      <Boton texto={`Pagar ${total}`} icono="card-outline" alTocar={pagar} ocupado={pagando} />
    </View>
  );
}

const estilos = StyleSheet.create({
  caja: { borderWidth: 1, borderColor: colores.primarioClaro, borderRadius: 10, padding: 14, gap: 8 },
  titulo: { fontSize: 17, fontWeight: '700', color: colores.texto },
  suave: { color: colores.textoSuave, fontSize: 13, marginBottom: 6 },
});
