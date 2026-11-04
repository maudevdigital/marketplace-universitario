import { Controller, Get } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Connection } from 'mongoose';
import { PrismaService } from './prisma/prisma.service';

// Sirve para comprobar en un segundo que las dos bases están conectadas
// (y para el healthcheck de Docker Compose).
@ApiTags('salud')
@Controller('salud')
export class SaludController {
  constructor(
    private readonly prisma: PrismaService,
    @InjectConnection() private readonly mongo: Connection,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Estado de la API y de las dos bases de datos' })
  @ApiOkResponse({ schema: { example: { api: 'ok', postgres: 'ok', mongo: 'ok' } } })
  async revisar() {
    const postgres = await this.prisma.$queryRaw`SELECT 1`.then(() => 'ok').catch(() => 'sin conexión');
    const mongo = this.mongo.readyState === 1 ? 'ok' : 'sin conexión';
    return { api: 'ok', postgres, mongo };
  }
}
