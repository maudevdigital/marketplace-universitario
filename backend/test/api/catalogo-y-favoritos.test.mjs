// HU-14: catálogo con filtros (HU-06) y favoritos (HU-09).
import assert from 'node:assert/strict';
import { before, describe, it } from 'node:test';
import { crearUsuario, pedir, publicar, sufijo } from './ayuda.mjs';

describe('Catálogo', () => {
  // Una palabra única en los títulos permite filtrar solo lo que crea esta prueba.
  const marca = `marca${sufijo()}`;
  let vendedor;
  before(async () => {
    vendedor = await crearUsuario('Vendedor Catálogo');
    await publicar(vendedor.token, { titulo: `Libro ${marca} barato`, categoriaId: '1', precio: '5000' });
    await publicar(vendedor.token, { titulo: `Libro ${marca} caro`, categoriaId: '1', precio: '90000' });
    await publicar(vendedor.token, { titulo: `Notebook ${marca}`, categoriaId: '2', precio: '300000' });
    const pausado = await publicar(vendedor.token, { titulo: `Pausado ${marca}`, categoriaId: '1', precio: '1000' });
    await pedir('PATCH', `/productos/${pausado.id}`, { token: vendedor.token, formulario: { estado: 'pausado' } });
  });

  it('busca sin importar mayúsculas y oculta lo pausado', async () => {
    const { cuerpo } = await pedir('GET', `/productos?q=${marca.toUpperCase()}`);
    assert.equal(cuerpo.total, 3);
  });

  it('filtra por categoría y rango de precio, y ordena', async () => {
    const { cuerpo } = await pedir('GET', `/productos?q=${marca}&categoria=1&orden=precio_desc`);
    assert.deepEqual(cuerpo.productos.map((p) => p.precio), [90000, 5000]);
    const rango = await pedir('GET', `/productos?q=${marca}&precioMin=1000&precioMax=100000`);
    assert.equal(rango.cuerpo.total, 2);
  });

  it('ignora los filtros vacíos y rechaza los inválidos', async () => {
    assert.equal((await pedir('GET', `/productos?q=${marca}&categoria=&precioMin=`)).cuerpo.total, 3);
    const invertido = await pedir('GET', '/productos?precioMin=5000&precioMax=10');
    assert.deepEqual([invertido.estado, invertido.cuerpo.mensaje], [400, 'El precio mínimo no puede ser mayor que el máximo.']);
    assert.equal((await pedir('GET', '/productos?orden=nombre')).estado, 400);
    assert.equal((await pedir('GET', '/productos?categoria=abc')).estado, 400);
  });

  it('el detalle es público y responde 404 si no existe', async () => {
    const { cuerpo } = await pedir('GET', `/productos?q=${marca}`);
    const detalle = await pedir('GET', `/productos/${cuerpo.productos[0].id}`);
    assert.equal(detalle.estado, 200);
    assert.equal(detalle.cuerpo.vendedor.id, vendedor.id);
    assert.equal((await pedir('GET', '/productos/999999')).estado, 404);
  });
});

describe('Favoritos', () => {
  let compradora;
  let producto;
  before(async () => {
    const vendedor = await crearUsuario('Vendedor Favoritos');
    compradora = await crearUsuario('Compradora Favoritos');
    producto = await publicar(vendedor.token);
  });

  it('exige sesión', async () => {
    assert.equal((await pedir('GET', '/favoritos')).estado, 401);
  });

  it('marcar dos veces no es error y aparece una sola vez', async () => {
    assert.equal((await pedir('POST', `/favoritos/${producto.id}`, { token: compradora.token })).estado, 201);
    assert.equal((await pedir('POST', `/favoritos/${producto.id}`, { token: compradora.token })).estado, 201);
    const { cuerpo } = await pedir('GET', '/favoritos', { token: compradora.token });
    assert.deepEqual(cuerpo.map((p) => p.id), [producto.id]);
  });

  it('quitar lo saca de la lista; un producto inexistente da 404', async () => {
    await pedir('DELETE', `/favoritos/${producto.id}`, { token: compradora.token });
    assert.equal((await pedir('GET', '/favoritos', { token: compradora.token })).cuerpo.length, 0);
    assert.equal((await pedir('POST', '/favoritos/999999', { token: compradora.token })).estado, 404);
  });
});
