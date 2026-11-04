import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { join } from 'node:path';
import { mkdirSync } from 'node:fs';
import { AppModule } from './app.module';
import { FiltroErrores } from './comun/filtro-errores';
import { crearTuberiaValidacion } from './comun/validacion';
import { carpetaImagenes } from './comun/imagenes';

async function bootstrap() {
  if (!process.env.JWT_SECRET) {
    // Sin secreto no se pueden firmar sesiones: mejor no arrancar que arrancar inseguro.
    throw new Error('Falta la variable de entorno JWT_SECRET (ver .env.example).');
  }

  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  const origenes = (process.env.CORS_ORIGEN ?? 'http://localhost:5173')
    .split(',')
    .map((origen) => origen.trim());
  app.enableCors({ origin: origenes });

  app.useGlobalPipes(crearTuberiaValidacion());
  app.useGlobalFilters(new FiltroErrores());

  // Imágenes: primero las del catálogo inicial (vienen en el repositorio),
  // después las que suben los usuarios (viven en un volumen de Docker).
  mkdirSync(carpetaImagenes(), { recursive: true });
  app.useStaticAssets(join(__dirname, '..', 'imagenes-iniciales'), { prefix: '/imagenes/' });
  app.useStaticAssets(carpetaImagenes(), { prefix: '/imagenes/' });

  const configuracion = new DocumentBuilder()
    .setTitle('Marketplace Universitario')
    .setDescription(
      'API del Hito 3 de Desarrollo Web y Móvil. Para probar las rutas con candado: ' +
        'POST /auth/ingreso, copiar el token y pegarlo en «Authorize».',
    )
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  SwaggerModule.setup('docs', app, SwaggerModule.createDocument(app, configuracion));

  const puerto = Number(process.env.PORT ?? 3000);
  await app.listen(puerto);
  console.log(`API en http://localhost:${puerto} · Swagger en http://localhost:${puerto}/docs`);
}

bootstrap();
