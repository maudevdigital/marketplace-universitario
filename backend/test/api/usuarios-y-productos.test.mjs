// HU-14: usuarios (HU-03), publicaciones (HU-05) y formato de errores (HU-02).
import assert from 'node:assert/strict';
import { describe, it, before } from 'node:test';
import { API, crearUsuario, imagenDePrueba, pedir, publicar } from './ayuda.mjs';

describe('Salud y documentación', () => {
  it('las dos bases están conectadas', async () => {
    const { estado, cuerpo } = await pedir('GET', '/salud');
    assert.equal(estado, 200);
    assert.deepEqual(cuerpo, { api: 'ok', postgres: 'ok', mongo: 'ok' });
  });

  it('Swagger publica el contrato de la API', async () => {
    const respuesta = await fetch(`${API}/docs-json`);
    assert.equal(respuesta.status, 200);
    const documento = await respuesta.json();
    for (const ruta of ['/productos', '/carrito', '/pedidos', '/conversaciones', '/sugerencias/producto']) {
      assert.ok(documento.paths[ruta], `falta ${ruta} en Swagger`);
    }
  });
});

describe('Cuentas y sesión', () => {
  let ana;
  before(async () => {
    ana = await crearUsuario('Ana Prueba');
  });

  it('no permite dos cuentas con el mismo correo', async () => {
    const { estado, cuerpo } = await pedir('POST', '/auth/registro', {
      cuerpo: { nombre: 'Otra Ana', correo: ana.correo.toUpperCase(), contrasena: 'Clave1234' },
    });
    assert.equal(estado, 409);
    assert.equal(cuerpo.mensaje, 'Ya existe una cuenta con ese correo.');
  });

  it('valida los datos del registro con mensajes en español', async () => {
    const { estado, cuerpo } = await pedir('POST', '/auth/registro', {
      cuerpo: { nombre: 'A', correo: 'malo', contrasena: 'corta', rol: 'admin' },
    });
    assert.equal(estado, 400);
    assert.match(cuerpo.mensaje, /«rol» no está permitido/);
    assert.match(cuerpo.mensaje, /El correo no es válido/);
  });

  it('no dice si el correo existe cuando la contraseña es incorrecta', async () => {
    const existe = await pedir('POST', '/auth/ingreso', { cuerpo: { correo: ana.correo, contrasena: 'Otra1234' } });
    const noExiste = await pedir('POST', '/auth/ingreso', { cuerpo: { correo: 'nadie@alumnos.cl', contrasena: 'Otra1234' } });
    assert.equal(existe.estado, 401);
    assert.equal(existe.cuerpo.mensaje, noExiste.cuerpo.mensaje);
  });

  it('/auth/yo exige sesión y nunca muestra la contraseña', async () => {
    assert.equal((await pedir('GET', '/auth/yo')).estado, 401);
    assert.equal((await pedir('GET', '/auth/yo', { token: 'falso' })).estado, 401);
    const { estado, cuerpo } = await pedir('GET', '/auth/yo', { token: ana.token });
    assert.equal(estado, 200);
    assert.equal(cuerpo.correo, ana.correo);
    assert.equal(cuerpo.hashContrasena, undefined);
  });

  it('el perfil público no muestra el correo', async () => {
    const { estado, cuerpo } = await pedir('GET', `/usuarios/${ana.id}`);
    assert.equal(estado, 200);
    assert.equal(cuerpo.correo, undefined);
    assert.equal((await pedir('GET', '/usuarios/abc')).estado, 400);
    assert.equal((await pedir('GET', '/usuarios/999999')).estado, 404);
  });
});

describe('Publicaciones', () => {
  let vendedora;
  let otra;
  before(async () => {
    vendedora = await crearUsuario('Vendedora Prueba');
    otra = await crearUsuario('Otra Persona');
  });

  it('publicar exige sesión', async () => {
    const { estado } = await pedir('POST', '/productos', { formulario: { titulo: 'Algo' } });
    assert.equal(estado, 401);
  });

  it('publica con imagen y la imagen queda disponible', async () => {
    const { estado, cuerpo } = await pedir('POST', '/productos', {
      token: vendedora.token,
      formulario: {
        titulo: '  Calculadora de prueba  ',
        descripcion: 'Científica, permitida en pruebas. Incluye tapa.',
        categoriaId: '2',
        precio: '18000',
        stock: '1',
        imagen: await imagenDePrueba(),
      },
    });
    assert.equal(estado, 201);
    assert.equal(cuerpo.titulo, 'Calculadora de prueba');
    assert.equal((await fetch(`${API}${cuerpo.imagen}`)).status, 200);
  });

  it('rechaza una categoría inexistente y datos inválidos', async () => {
    const sinCategoria = await pedir('POST', '/productos', {
      token: vendedora.token,
      formulario: { titulo: 'Algo', descripcion: 'Una descripción de más de veinte letras.', categoriaId: '999', precio: '1', stock: '1' },
    });
    assert.equal(sinCategoria.estado, 400);
    assert.equal(sinCategoria.cuerpo.mensaje, 'La categoría no existe.');
    const precioVacio = await pedir('POST', '/productos', {
      token: vendedora.token,
      formulario: { titulo: 'Algo', descripcion: 'Una descripción de más de veinte letras.', categoriaId: '2', precio: '', stock: '1' },
    });
    assert.equal(precioVacio.cuerpo.mensaje, 'El precio debe ser un número entero.');
  });

  it('solo la dueña edita y elimina', async () => {
    const producto = await publicar(vendedora.token);
    assert.equal((await pedir('PATCH', `/productos/${producto.id}`, { token: otra.token, formulario: { precio: '1' } })).estado, 403);
    assert.equal((await pedir('DELETE', `/productos/${producto.id}`, { token: otra.token })).estado, 403);
    const borrado = await pedir('DELETE', `/productos/${producto.id}`, { token: vendedora.token });
    assert.deepEqual([borrado.estado, borrado.cuerpo.archivado], [200, false]);
    assert.equal((await pedir('DELETE', `/productos/${producto.id}`, { token: vendedora.token })).estado, 404);
  });

  it('con stock 0 queda agotada; un campo vacío al editar no cambia nada', async () => {
    const producto = await publicar(vendedora.token, { stock: '3' });
    const vacio = await pedir('PATCH', `/productos/${producto.id}`, { token: vendedora.token, formulario: { stock: '', precio: '' } });
    assert.deepEqual([vacio.cuerpo.stock, vacio.cuerpo.estado], [3, 'activo']);
    const agotado = await pedir('PATCH', `/productos/${producto.id}`, { token: vendedora.token, formulario: { stock: '0' } });
    assert.equal(agotado.cuerpo.estado, 'agotado');
    const pausar = await pedir('PATCH', `/productos/${producto.id}`, { token: vendedora.token, formulario: { estado: 'eliminado' } });
    assert.equal(pausar.estado, 400);
  });
});
