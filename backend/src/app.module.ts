import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { PrismaModule } from './comun/prisma/prisma.module';
import { SaludController } from './comun/salud.controller';

// Cada integrante agrega aquí el módulo de su historia (favoritos, carrito, pedidos,
// conversaciones, sugerencias…), siempre en su propia carpeta dentro de src/.
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MongooseModule.forRoot(process.env.MONGO_URI ?? 'mongodb://localhost:27018/marketplace'),
    PrismaModule,
  ],
  controllers: [SaludController],
})
export class AppModule {}
