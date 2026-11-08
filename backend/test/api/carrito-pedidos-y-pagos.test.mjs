// HU-14: carrito (HU-10), compra «todo o nada» (HU-11), pago, entrega y cancelación (HU-12).
import assert from 'node:assert/strict';
import { before, describe, it } from 'node:test';
import { crearUsuario, pedir, publicar, stockDe } from './ayuda.mjs';

const TARJETA = { numeroTarjeta: '4242 4242 4242 4242', titular: 'Compradora Prueba', vencimiento: '12/40', cvv: '123' };
const RECHAZADA = { ...TARJETA, numeroTarjeta: '4000 0000 0000 0002' };

describe('Del carrito al pedido entregado', () => {
  let vendedorA;
  let vendedorB;
  let compradora;
  let rival;
  let unica; // stock 1
  let triple; // stock 3
  let otro; // de otro vendedor
  before(async () => {
    vendedorA = await crearUsuario('Vendedor A');
    vendedorB = await crearUsuario('Vendedor B');
    compradora = await crearUsuario('Compradora');
    rival = await crearUsuario('Rival');
    unica = await publicar(vendedorA.token, { stock: '1', precio: '145000' });
    triple = await publicar(vendedorA.token, { stock: '3', precio: '20000' });
    otro = await publicar(vendedorB.token, { stock: '2', precio: '5000' });
  });

  it('el carrito no deja pasar del stock ni comprar lo propio', async () => {
    const mucho = await pedir('POST', '/carrito/items', { token: compradora.token, cuerpo: { productoId: unica.id, cantidad: 2 } });
    assert.deepEqual([mucho.estado, mucho.cuerpo.mensaje], [409, 'Solo queda 1 unidad.']);
    const propio = await pedir('POST', '/carrito/items', { token: vendedorA.token, cuerpo: { productoId: unica.id } });
    assert.equal(propio.estado, 422);
    const cero = await pedir('POST', '/carrito/items', { token: compradora.token, cuerpo: { productoId: unica.id, cantidad: 0 } });
    assert.equal(cero.estado, 400);
  });

  it('calcula total y cuántos pedidos se van a crear', async () => {
    await pedir('POST', '/carrito/items', { token: compradora.token, cuerpo: { productoId: unica.id } });
    await pedir('POST', '/carrito/items', { token: compradora.token, cuerpo: { productoId: triple.id, cantidad: 3 } });
    await pedir('POST', '/carrito/items', { token: compradora.token, cuerpo: { productoId: otro.id } });
    const extra = await pedir('PATCH', `/carrito/items/${triple.id}`, { token: compradora.token, cuerpo: { cantidad: 4 } });
    assert.deepEqual([extra.estado, extra.cuerpo.mensaje], [409, 'Solo quedan 3 unidades.']);
    const { cuerpo } = await pedir('GET', '/carrito', { token: compradora.token });
    assert.equal(cuerpo.total, 145000 + 3 * 20000 + 5000);
    assert.equal(cuerpo.pedidosAGenerar, 2);
    assert.equal(cuerpo.sePuedeComprar, true);
  });

  it('si otra persona compra antes la última unidad, no se crea ningún pedido', async () => {
    await pedir('POST', '/carrito/items', { token: rival.token, cuerpo: { productoId: unica.id } });
    assert.equal((await pedir('POST', '/pedidos', { token: rival.token })).estado, 201);
    const { estado } = await pedir('POST', '/pedidos', { token: compradora.token });
    assert.equal(estado, 409);
    assert.deepEqual(await stockDe(triple.id), { stock: 3, estado: 'activo' });
    assert.equal((await pedir('GET', '/pedidos', { token: compradora.token })).cuerpo.length, 0);
  });

  it('sin el producto agotado compra: un pedido por vendedor y el carrito queda vacío', async () => {
    await pedir('DELETE', `/carrito/items/${unica.id}`, { token: compradora.token });
    const { estado, cuerpo } = await pedir('POST', '/pedidos', { token: compradora.token });
    assert.equal(estado, 201);
    assert.equal(cuerpo.length, 2);
    assert.deepEqual(await stockDe(triple.id), { stock: 0, estado: 'agotado' });
    assert.equal((await pedir('GET', '/carrito', { token: compradora.token })).cuerpo.items.length, 0);
    assert.equal((await pedir('POST', '/pedidos', { token: compradora.token })).estado, 422);
  });

  it('pago: rechazado, inválido, aprobado y no dos veces', async () => {
    const [pedido] = (await pedir('GET', '/pedidos', { token: compradora.token })).cuerpo.filter((p) => p.vendedor.id === vendedorA.id);
    const ruta = `/pedidos/${pedido.id}/pago`;
    assert.equal((await pedir('POST', ruta, { token: compradora.token, cuerpo: RECHAZADA })).estado, 402);
    assert.equal((await pedir('GET', `/pedidos/${pedido.id}`, { token: compradora.token })).cuerpo.estado, 'pendiente');
    assert.equal((await pedir('POST', ruta, { token: compradora.token, cuerpo: { ...TARJETA, vencimiento: '01/20' } })).estado, 400);
    assert.equal((await pedir('POST', ruta, { token: vendedorA.token, cuerpo: TARJETA })).estado, 403);
    assert.equal((await pedir('POST', `/pedidos/${pedido.id}/entrega`, { token: vendedorA.token })).estado, 409);
    const pagado = await pedir('POST', ruta, { token: compradora.token, cuerpo: TARJETA });
    assert.equal(pagado.cuerpo.estado, 'pagado');
    assert.deepEqual(pagado.cuerpo.pagos.map((p) => p.estado).sort(), ['aprobado', 'rechazado']);
    assert.equal((await pedir('POST', ruta, { token: compradora.token, cuerpo: TARJETA })).estado, 409);
  });

  it('entrega y cancelación respetan quién puede y en qué estado', async () => {
    const pedidos = (await pedir('GET', '/pedidos', { token: compradora.token })).cuerpo;
    const pagado = pedidos.find((p) => p.vendedor.id === vendedorA.id);
    const pendiente = pedidos.find((p) => p.vendedor.id === vendedorB.id);
    assert.equal((await pedir('GET', `/pedidos/${pagado.id}`, { token: rival.token })).estado, 403);
    assert.equal((await pedir('POST', `/pedidos/${pagado.id}/entrega`, { token: compradora.token })).estado, 403);
    assert.equal((await pedir('POST', `/pedidos/${pagado.id}/entrega`, { token: vendedorA.token })).cuerpo.estado, 'entregado');
    assert.equal((await pedir('POST', `/pedidos/${pagado.id}/cancelacion`, { token: compradora.token })).estado, 409);
    const cancelado = await pedir('POST', `/pedidos/${pendiente.id}/cancelacion`, { token: compradora.token });
    assert.equal(cancelado.cuerpo.estado, 'cancelado');
    assert.deepEqual(await stockDe(otro.id), { stock: 2, estado: 'activo' });
  });

  it('un producto ya vendido se archiva en vez de borrarse', async () => {
    const { cuerpo } = await pedir('DELETE', `/productos/${triple.id}`, { token: vendedorA.token });
    assert.equal(cuerpo.archivado, true);
  });
});

describe('Dos personas compran la última unidad al mismo tiempo', () => {
  it('una compra, la otra recibe 409 y el stock nunca queda negativo', async () => {
    const vendedor = await crearUsuario('Vendedor Carrera');
    const personas = [await crearUsuario('Persona 1'), await crearUsuario('Persona 2')];
    for (let ronda = 0; ronda < 5; ronda += 1) {
      const producto = await publicar(vendedor.token, { stock: '1' });
      for (const persona of personas) {
        await pedir('DELETE', '/carrito', { token: persona.token });
        await pedir('POST', '/carrito/items', { token: persona.token, cuerpo: { productoId: producto.id } });
      }
      const respuestas = await Promise.all(personas.map((p) => pedir('POST', '/pedidos', { token: p.token })));
      assert.deepEqual(respuestas.map((r) => r.estado).sort(), [201, 409], `ronda ${ronda + 1}`);
      assert.deepEqual(await stockDe(producto.id), { stock: 0, estado: 'agotado' });
    }
  });
});
