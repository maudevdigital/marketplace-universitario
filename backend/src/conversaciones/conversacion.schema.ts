import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

// HU-13: colección «conversaciones» en MongoDB. Ver docs/arquitectura.md, sección 3.
//
// Un documento por par (producto, comprador), con los mensajes DENTRO del documento:
// - una conversación se lee entera de una vez → una sola lectura, sin uniones de tablas;
// - los mensajes solo se agregan (nunca se editan) y no mueven dinero ni stock;
// - no repite nada de PostgreSQL: no existe tabla de mensajes. Solo se copia el título del
//   producto para mostrar la bandeja sin consultar la otra base.

@Schema({ _id: true })
export class Mensaje {
  @Prop({ required: true })
  autorId: number;

  @Prop({ required: true, maxlength: 1000 })
  texto: string;

  @Prop({ required: true, default: () => new Date() })
  enviadoEn: Date;

  // Lo marca como leído la OTRA persona al abrir la conversación.
  @Prop({ required: true, default: false })
  leido: boolean;
}
export const MensajeSchema = SchemaFactory.createForClass(Mensaje);

@Schema({ collection: 'conversaciones', versionKey: false })
export class Conversacion {
  // Identificadores que vienen de PostgreSQL (productos y usuarios)
  @Prop({ required: true })
  productoId: number;

  @Prop({ required: true })
  productoTitulo: string;

  @Prop({ required: true })
  compradorId: number;

  @Prop({ required: true })
  vendedorId: number;

  @Prop({ type: [MensajeSchema], default: [] })
  mensajes: Mensaje[];

  @Prop({ required: true })
  ultimoMensajeEn: Date;

  @Prop({ required: true, default: () => new Date() })
  creadoEn: Date;
}

export type ConversacionDocumento = HydratedDocument<Conversacion>;
export const ConversacionSchema = SchemaFactory.createForClass(Conversacion);

// Una sola conversación por producto y comprador: si vuelve a preguntar, se suma a la misma.
ConversacionSchema.index({ productoId: 1, compradorId: 1 }, { unique: true });
// Bandejas ordenadas por el último mensaje, como vendedor y como comprador.
ConversacionSchema.index({ vendedorId: 1, ultimoMensajeEn: -1 });
ConversacionSchema.index({ compradorId: 1, ultimoMensajeEn: -1 });
