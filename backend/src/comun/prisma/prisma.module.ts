import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

// Global: cualquier servicio puede pedir PrismaService sin importar este módulo.
@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
