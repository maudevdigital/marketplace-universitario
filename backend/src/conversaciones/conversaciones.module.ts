import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Conversacion, ConversacionSchema } from './conversacion.schema';
import { ConversacionesController } from './conversaciones.controller';
import { ConversacionesService } from './conversaciones.service';

@Module({
  imports: [MongooseModule.forFeature([{ name: Conversacion.name, schema: ConversacionSchema }])],
  controllers: [ConversacionesController],
  providers: [ConversacionesService],
})
export class ConversacionesModule {}
