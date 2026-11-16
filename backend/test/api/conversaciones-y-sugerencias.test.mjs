// HU-14: conversaciones en MongoDB (HU-13) y sugerencias de Mercado Libre (HU-08).
import assert from 'node:assert/strict';
import { before, describe, it } from 'node:test';
import { crearUsuario, pedir, publicar } from './ayuda.mjs';

describe('Conversaciones', () => {
  let vendedor;
  let compradora;
  let curioso;
  let producto;
  let id;
  before(async () => {
    vendedor = await crearUsuario('Vendedor Mensajes');
    compradora = await crearUsuario('Compradora Mensajes');
    curioso = await crearUsuario('Curioso');
    producto = await publicar(vendedor.token);
  });

  it('la compradora pregunta y al vendedor le aparece sin leer', async () => {
    const { estado, cuerpo } = await pedir('POST', '/conversaciones', {
      token: compradora.token,
      cuerpo: { productoId: producto.id, texto: '¿Sigue disponible?' },
    });
    assert.equal(estado, 201);
    assert.equal(cuerpo.miRol, 'comprador');
    id = cuerpo.id;
    assert.deepEqual((await pedir('GET', '/conversaciones/no-leidos', { token: vendedor.token })).cuerpo, { total: 1 });
    const [enBandeja] = (await pedir('GET', '/conversaciones', { token: vendedor.token })).cuerpo;
    assert.equal(enBandeja.otraPersona.nombre, 'Compradora Mensajes');
    assert.equal(enBandeja.noLeidos, 1);
  });

  it('al abrirla se marcan como leídos y la respuesta llega a la compradora', async () => {
    const respuesta = await pedir('POST', `/conversaciones/${id}/mensajes`, { token: vendedor.token, cuerpo: { texto: 'Sí, todavía.' } });
    assert.equal(respuesta.estado, 201);
    assert.equal((await pedir('GET', '/conversaciones/no-leidos', { token: vendedor.token })).cuerpo.total, 0);
    assert.equal((await pedir('GET', '/conversaciones/no-leidos', { token: compradora.token })).cuerpo.total, 1);
    const abierta = await pedir('GET', `/conversaciones/${id}`, { token: compradora.token });
    assert.deepEqual(abierta.cuerpo.mensajes.map((m) => [m.texto, m.esMio]), [['¿Sigue disponible?', true], ['Sí, todavía.', false]]);
    assert.equal(abierta.cuerpo.mensajes[0].leido, true); // el vendedor ya la leyó
  });

  it('volver a preguntar por el mismo producto usa la misma conversación', async () => {
    const otra = await pedir('POST', '/conversaciones', {
      token: compradora.token,
      cuerpo: { productoId: producto.id, texto: '¿Dónde lo entregas?' },
    });
    assert.equal(otra.cuerpo.id, id);
    assert.equal(otra.cuerpo.mensajes.length, 3);
  });

  it('protege la conversación y valida los datos', async () => {
    assert.equal((await pedir('GET', `/conversaciones/${id}`, { token: curioso.token })).estado, 403);
    assert.equal((await pedir('GET', '/conversaciones/123', { token: curioso.token })).estado, 400);
    assert.equal((await pedir('GET', '/conversaciones/0123456789abcdef01234567', { token: curioso.token })).estado, 404);
    const propio = await pedir('POST', '/conversaciones', { token: vendedor.token, cuerpo: { productoId: producto.id, texto: 'hola' } });
    assert.equal(propio.estado, 422);
    const vacio = await pedir('POST', `/conversaciones/${id}/mensajes`, { token: compradora.token, cuerpo: { texto: '   ' } });
    assert.equal(vacio.estado, 400);
    assert.equal((await pedir('GET', '/conversaciones')).estado, 401);
  });
});

describe('Sugerencias de Mercado Libre', () => {
  let persona;
  before(async () => {
    persona = await crearUsuario('Quien Publica');
  });

  it('exige sesión y un título de al menos 4 letras', async () => {
    assert.equal((await pedir('GET', '/sugerencias/producto?titulo=guitarra')).estado, 401);
    assert.equal((await pedir('GET', '/sugerencias/producto?titulo=ab', { token: persona.token })).estado, 400);
  });

  // Depende de internet: si Mercado Libre no responde, lo correcto es un 503 con mensaje claro.
  it('sugiere categoría y marca, o responde 503 si Mercado Libre no está disponible', async () => {
    const { estado, cuerpo } = await pedir('GET', '/sugerencias/producto?titulo=bicicleta%20trek%20aro%2029', { token: persona.token });
    if (estado === 503) {
      assert.match(cuerpo.mensaje, /Completa los datos a mano/);
      return;
    }
    assert.equal(estado, 200);
    assert.equal(cuerpo.categoria?.nombre, 'Deportes');
    assert.equal(cuerpo.marca, 'Trek');
    assert.equal(cuerpo.encontrada, true);
  });
});
