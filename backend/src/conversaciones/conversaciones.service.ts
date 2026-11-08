import {
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { PrismaService } from '../comun/prisma/prisma.service';
import { Conversacion } from './conversacion.schema';

type Rol = 'comprador' | 'vendedor';

// HU-13: conversaciones entre comprador y vendedor.
// Los mensajes viven en MongoDB; de PostgreSQL solo se leen el producto (para validar a quién
// se le pregunta) y los nombres de las personas (para mostrarlos). Nada se guarda dos veces.
@Injectable()
export class ConversacionesService {
  constructor(
    @InjectModel(Conversacion.name) private readonly conversaciones: Model<Conversacion>,
    private readonly prisma: PrismaService,
  ) {}

  // Pregunta por un producto. Si ya había una conversación de esta persona por ese producto,
  // el mensaje se suma a la misma (una sola conversación por producto y comprador).
  async iniciar(usuarioId: number, productoId: number, texto: string) {
    const producto = await this.prisma.producto.findUnique({
      where: { id: productoId },
      select: { id: true, titulo: true, vendedorId: true, estado: true },
    });
    if (!producto || producto.estado === 'eliminado') {
      throw new NotFoundException('La publicación no existe.');
    }
    if (producto.vendedorId === usuarioId) {
      throw new UnprocessableEntityException('No puedes enviarte preguntas sobre tu propio producto.');
    }

    const ahora = new Date();
    const filtro = { productoId, compradorId: usuarioId };
    const cambios = {
      $setOnInsert: { productoTitulo: producto.titulo, vendedorId: producto.vendedorId, creadoEn: ahora },
      $push: { mensajes: { autorId: usuarioId, texto, enviadoEn: ahora, leido: false } },
      $set: { ultimoMensajeEn: ahora },
    };
    let conversacion;
    try {
      // upsert: crea el documento si no existe, o agrega el mensaje si ya existe. Es una sola
      // operación en MongoDB, así que dos mensajes rápidos no crean dos conversaciones.
      conversacion = await this.conversaciones.findOneAndUpdate(filtro, cambios, { upsert: true, new: true });
    } catch (error) {
      // Si dos peticiones intentaron crearla al mismo tiempo, el índice único deja pasar solo
      // una: la otra reintenta y se suma a la conversación que ya existe.
      if ((error as { code?: number }).code !== 11000) throw error;
      conversacion = await this.conversaciones.findOneAndUpdate(filtro, cambios, { new: true });
    }
    return this.detalle(String(conversacion!._id), usuarioId);
  }

  // Bandeja: mis conversaciones como comprador y como vendedor, la más reciente primero.
  // El conteo de no leídos y el último mensaje los calcula MongoDB con una agregación,
  // sin traer todos los mensajes.
  async bandeja(usuarioId: number) {
    const resumenes = await this.conversaciones.aggregate<{
      _id: Types.ObjectId;
      productoId: number;
      productoTitulo: string;
      compradorId: number;
      vendedorId: number;
      ultimoMensajeEn: Date;
      ultimo: { autorId: number; texto: string; enviadoEn: Date };
      noLeidos: number;
    }>([
      { $match: { $or: [{ compradorId: usuarioId }, { vendedorId: usuarioId }] } },
      { $sort: { ultimoMensajeEn: -1 } },
      {
        $project: {
          productoId: 1,
          productoTitulo: 1,
          compradorId: 1,
          vendedorId: 1,
          ultimoMensajeEn: 1,
          ultimo: { $last: '$mensajes' },
          noLeidos: {
            $size: {
              $filter: {
                input: '$mensajes',
                as: 'm',
                cond: { $and: [{ $ne: ['$$m.autorId', usuarioId] }, { $eq: ['$$m.leido', false] }] },
              },
            },
          },
        },
      },
    ]);

    const nombres = await this.nombres(resumenes.flatMap((c) => [c.compradorId, c.vendedorId]));
    return resumenes.map((c) => {
      const miRol: Rol = c.compradorId === usuarioId ? 'comprador' : 'vendedor';
      const otraPersonaId = miRol === 'comprador' ? c.vendedorId : c.compradorId;
      return {
        id: String(c._id),
        producto: { id: c.productoId, titulo: c.productoTitulo },
        miRol,
        otraPersona: { id: otraPersonaId, nombre: nombres.get(otraPersonaId) ?? 'Usuario' },
        ultimoMensaje: {
          texto: c.ultimo.texto,
          enviadoEn: c.ultimo.enviadoEn,
          esMio: c.ultimo.autorId === usuarioId,
        },
        noLeidos: c.noLeidos,
        ultimoMensajeEn: c.ultimoMensajeEn,
      };
    });
  }

  // Total de mensajes sin leer, para el número rojo del menú.
  async noLeidos(usuarioId: number) {
    const [resultado] = await this.conversaciones.aggregate<{ total: number }>([
      { $match: { $or: [{ compradorId: usuarioId }, { vendedorId: usuarioId }] } },
      { $unwind: '$mensajes' },
      { $match: { 'mensajes.autorId': { $ne: usuarioId }, 'mensajes.leido': false } },
      { $count: 'total' },
    ]);
    return { total: resultado?.total ?? 0 };
  }

  // Abre una conversación: devuelve todos los mensajes y marca como leídos los de la otra persona.
  async detalle(id: string, usuarioId: number) {
    const conversacion = await this.buscarComoParticipante(id, usuarioId);
    const hayNoLeidos = conversacion.mensajes.some((m) => m.autorId !== usuarioId && !m.leido);
    if (hayNoLeidos) {
      await this.conversaciones.updateOne(
        { _id: conversacion._id },
        { $set: { 'mensajes.$[m].leido': true } },
        { arrayFilters: [{ 'm.autorId': { $ne: usuarioId }, 'm.leido': false }] },
      );
    }

    const [nombres, producto] = await Promise.all([
      this.nombres([conversacion.compradorId, conversacion.vendedorId]),
      this.prisma.producto.findUnique({
        where: { id: conversacion.productoId },
        select: { id: true, titulo: true, precio: true, imagen: true, estado: true },
      }),
    ]);
    const persona = (idPersona: number) => ({ id: idPersona, nombre: nombres.get(idPersona) ?? 'Usuario' });

    return {
      id: String(conversacion._id),
      // Si el producto se borró, se muestra con el título que quedó guardado en la conversación.
      producto: producto ?? { id: conversacion.productoId, titulo: conversacion.productoTitulo, estado: 'eliminado' },
      miRol: (conversacion.compradorId === usuarioId ? 'comprador' : 'vendedor') as Rol,
      comprador: persona(conversacion.compradorId),
      vendedor: persona(conversacion.vendedorId),
      mensajes: conversacion.mensajes.map((m) => ({
        id: String((m as unknown as { _id: Types.ObjectId })._id),
        autorId: m.autorId,
        texto: m.texto,
        enviadoEn: m.enviadoEn,
        // Para quien abre: sus propios mensajes muestran si la otra persona ya los leyó.
        leido: m.autorId === usuarioId ? m.leido : true,
        esMio: m.autorId === usuarioId,
      })),
    };
  }

  async responder(id: string, usuarioId: number, texto: string) {
    const conversacion = await this.buscarComoParticipante(id, usuarioId);
    const ahora = new Date();
    await this.conversaciones.updateOne(
      { _id: conversacion._id },
      {
        $push: { mensajes: { autorId: usuarioId, texto, enviadoEn: ahora, leido: false } },
        $set: { ultimoMensajeEn: ahora },
      },
    );
    return this.detalle(id, usuarioId);
  }

  // 404 si no existe; 403 si la persona no es ni el comprador ni el vendedor.
  private async buscarComoParticipante(id: string, usuarioId: number) {
    const conversacion = await this.conversaciones.findById(id).lean();
    if (!conversacion) throw new NotFoundException('La conversación no existe.');
    if (conversacion.compradorId !== usuarioId && conversacion.vendedorId !== usuarioId) {
      throw new ForbiddenException('Esta conversación es de otras personas.');
    }
    return conversacion;
  }

  private async nombres(ids: number[]) {
    const usuarios = await this.prisma.usuario.findMany({
      where: { id: { in: [...new Set(ids)] } },
      select: { id: true, nombre: true },
    });
    return new Map(usuarios.map((u) => [u.id, u.nombre]));
  }
}
