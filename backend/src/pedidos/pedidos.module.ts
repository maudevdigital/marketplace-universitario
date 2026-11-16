import { Module } from '@nestjs/common';
import { PedidosController } from './pedidos.controller';
import { PedidosService } from './pedidos.service';
import { PagosService } from './pagos.service';

@Module({
  controllers: [PedidosController],
  providers: [PedidosService, PagosService],
})
export class PedidosModule {}
