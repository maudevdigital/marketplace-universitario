# UniMarket · Marketplace Universitario

Plataforma web para comprar y vender artículos usados dentro de la comunidad universitaria.
Hito 3 de Desarrollo Web y Móvil (segundo semestre 2026), **caso 3.4: Marketplace universitario**.

> Este README es la base para el equipo. La versión completa (problema, arquitectura, pruebas,
> limitaciones y uso de inteligencia artificial) se termina en HU-15.

## Integrantes (Grupo 10)

| Nombre | GitHub | Historias |
|---|---|---|
| Lucas Maulén Riquelme | [maudevdigital](https://github.com/maudevdigital) | HU-01 a HU-05, integración, presentación |
| Matías Catalán Ortega | [maticata011-bit](https://github.com/maticata011-bit) | HU-06, HU-07, HU-09 a HU-12 |
| Juan Soto Toledo | _completar_ | HU-08, HU-13 a HU-15 |

## Continuidad

Este proyecto reescribe el [Marketplace Universitario de la Actividad Evaluada 1](https://github.com/Matias2004-cmd/Proyecto-Marketplace-Universitario)
(HTML, Bootstrap y JavaScript con datos simulados) como una plataforma completa con React, una API
propia, PostgreSQL y MongoDB. En el Taller 2 el grupo trabajó otro caso (Metas UF); para el Hito 3 el
profesor indicó volver al marketplace, que corresponde al caso 3.4 del enunciado.

Se conservan la identidad visual (paleta y tema oscuro), las imágenes y los 12 productos de la
Actividad 1, que ahora se cargan en la base como datos iniciales.

## Cómo ejecutarlo

Requisitos: Docker Desktop.

```bash
cp .env.example .env
docker compose up --build
```

| Servicio | Dirección |
|---|---|
| Aplicación web | http://localhost:8080 |
| API | http://localhost:3000 |
| Swagger | http://localhost:3000/docs |
| PostgreSQL | `localhost:5433` (usuario y clave en `.env`) |
| MongoDB | `localhost:27018` |

Al arrancar, el backend aplica las migraciones y carga los datos iniciales (sin duplicarlos).

**Usuarios de prueba** (todos con la contraseña `Clave1234`, datos ficticios):
`demo@alumnos.cl` (solo compra) y los vendedores de la Actividad 1, por ejemplo
`camila.rojas@alumnos.cl` o `matias.silva@alumnos.cl`.

### Desarrollo sin reconstruir imágenes

```bash
docker compose up -d postgres mongo

cd backend
cp .env.example .env
npm install
npx prisma migrate deploy
npx prisma db seed
npm run start:dev          # http://localhost:3000

cd ../frontend
cp .env.example .env.local
npm install
npm run dev                # http://localhost:5173
```

## Documentación

- [Arquitectura, modelo de datos, endpoints y reglas](docs/arquitectura.md)
- [Registro de uso de inteligencia artificial](docs/uso-ia.md)

## Cómo trabajamos

- `main` solo recibe la versión final desde `develop`.
- Cada historia en su rama (`feature/hu-06-catalogo`) y entra a `develop` por Pull Request
  revisado por otra persona, con `Closes #n`.
- Commits en español y descriptivos: `feat(pedidos): descuenta stock en una transacción`.
