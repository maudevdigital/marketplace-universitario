-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "EstadoProducto" AS ENUM ('activo', 'pausado', 'agotado', 'eliminado');

-- CreateEnum
CREATE TYPE "CondicionProducto" AS ENUM ('nuevo', 'como_nuevo', 'usado');

-- CreateEnum
CREATE TYPE "EstadoPedido" AS ENUM ('pendiente', 'pagado', 'entregado', 'cancelado');

-- CreateEnum
CREATE TYPE "EstadoPago" AS ENUM ('aprobado', 'rechazado');

-- CreateTable
CREATE TABLE "usuarios" (
    "id" SERIAL NOT NULL,
    "nombre" VARCHAR(80) NOT NULL,
    "correo" VARCHAR(120) NOT NULL,
    "hash_contrasena" TEXT NOT NULL,
    "carrera" VARCHAR(80),
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categorias" (
    "id" SERIAL NOT NULL,
    "nombre" VARCHAR(40) NOT NULL,
    "icono" VARCHAR(40) NOT NULL,

    CONSTRAINT "categorias_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "equivalencias_categoria" (
    "id" SERIAL NOT NULL,
    "categoria_mercado_libre" VARCHAR(120) NOT NULL,
    "categoria_id" INTEGER NOT NULL,

    CONSTRAINT "equivalencias_categoria_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "productos" (
    "id" SERIAL NOT NULL,
    "vendedor_id" INTEGER NOT NULL,
    "categoria_id" INTEGER NOT NULL,
    "titulo" VARCHAR(120) NOT NULL,
    "descripcion" TEXT NOT NULL,
    "marca" VARCHAR(60),
    "modelo" VARCHAR(60),
    "condicion" "CondicionProducto" NOT NULL DEFAULT 'usado',
    "precio" INTEGER NOT NULL,
    "stock" INTEGER NOT NULL,
    "estado" "EstadoProducto" NOT NULL DEFAULT 'activo',
    "imagen" VARCHAR(200),
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_en" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "productos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "favoritos" (
    "usuario_id" INTEGER NOT NULL,
    "producto_id" INTEGER NOT NULL,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "favoritos_pkey" PRIMARY KEY ("usuario_id","producto_id")
);

-- CreateTable
CREATE TABLE "items_carrito" (
    "usuario_id" INTEGER NOT NULL,
    "producto_id" INTEGER NOT NULL,
    "cantidad" INTEGER NOT NULL,

    CONSTRAINT "items_carrito_pkey" PRIMARY KEY ("usuario_id","producto_id")
);

-- CreateTable
CREATE TABLE "pedidos" (
    "id" SERIAL NOT NULL,
    "comprador_id" INTEGER NOT NULL,
    "vendedor_id" INTEGER NOT NULL,
    "estado" "EstadoPedido" NOT NULL DEFAULT 'pendiente',
    "total" INTEGER NOT NULL,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_en" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pedidos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "detalles_pedido" (
    "id" SERIAL NOT NULL,
    "pedido_id" INTEGER NOT NULL,
    "producto_id" INTEGER NOT NULL,
    "cantidad" INTEGER NOT NULL,
    "precio_unitario" INTEGER NOT NULL,
    "subtotal" INTEGER NOT NULL,

    CONSTRAINT "detalles_pedido_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pagos" (
    "id" SERIAL NOT NULL,
    "pedido_id" INTEGER NOT NULL,
    "monto" INTEGER NOT NULL,
    "estado" "EstadoPago" NOT NULL,
    "comprobante" VARCHAR(40) NOT NULL,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pagos_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_correo_key" ON "usuarios"("correo");

-- CreateIndex
CREATE UNIQUE INDEX "categorias_nombre_key" ON "categorias"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "equivalencias_categoria_categoria_mercado_libre_key" ON "equivalencias_categoria"("categoria_mercado_libre");

-- CreateIndex
CREATE INDEX "productos_categoria_id_idx" ON "productos"("categoria_id");

-- CreateIndex
CREATE INDEX "productos_vendedor_id_idx" ON "productos"("vendedor_id");

-- CreateIndex
CREATE INDEX "productos_estado_idx" ON "productos"("estado");

-- CreateIndex
CREATE INDEX "pedidos_comprador_id_idx" ON "pedidos"("comprador_id");

-- CreateIndex
CREATE INDEX "pedidos_vendedor_id_idx" ON "pedidos"("vendedor_id");

-- CreateIndex
CREATE INDEX "detalles_pedido_pedido_id_idx" ON "detalles_pedido"("pedido_id");

-- CreateIndex
CREATE UNIQUE INDEX "pagos_comprobante_key" ON "pagos"("comprobante");

-- CreateIndex
CREATE INDEX "pagos_pedido_id_idx" ON "pagos"("pedido_id");

-- AddForeignKey
ALTER TABLE "equivalencias_categoria" ADD CONSTRAINT "equivalencias_categoria_categoria_id_fkey" FOREIGN KEY ("categoria_id") REFERENCES "categorias"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "productos" ADD CONSTRAINT "productos_vendedor_id_fkey" FOREIGN KEY ("vendedor_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "productos" ADD CONSTRAINT "productos_categoria_id_fkey" FOREIGN KEY ("categoria_id") REFERENCES "categorias"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "favoritos" ADD CONSTRAINT "favoritos_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "favoritos" ADD CONSTRAINT "favoritos_producto_id_fkey" FOREIGN KEY ("producto_id") REFERENCES "productos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "items_carrito" ADD CONSTRAINT "items_carrito_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "items_carrito" ADD CONSTRAINT "items_carrito_producto_id_fkey" FOREIGN KEY ("producto_id") REFERENCES "productos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pedidos" ADD CONSTRAINT "pedidos_comprador_id_fkey" FOREIGN KEY ("comprador_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pedidos" ADD CONSTRAINT "pedidos_vendedor_id_fkey" FOREIGN KEY ("vendedor_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "detalles_pedido" ADD CONSTRAINT "detalles_pedido_pedido_id_fkey" FOREIGN KEY ("pedido_id") REFERENCES "pedidos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "detalles_pedido" ADD CONSTRAINT "detalles_pedido_producto_id_fkey" FOREIGN KEY ("producto_id") REFERENCES "productos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pagos" ADD CONSTRAINT "pagos_pedido_id_fkey" FOREIGN KEY ("pedido_id") REFERENCES "pedidos"("id") ON DELETE CASCADE ON UPDATE CASCADE;


-- ---------------------------------------------------------------------------
-- Restricciones agregadas a mano (Prisma no las puede expresar en schema.prisma).
-- Protegen los datos aunque alguien se salte las validaciones de la API.
-- ---------------------------------------------------------------------------

ALTER TABLE "productos"
    ADD CONSTRAINT "productos_precio_positivo" CHECK ("precio" > 0),
    ADD CONSTRAINT "productos_stock_no_negativo" CHECK ("stock" >= 0);

ALTER TABLE "items_carrito"
    ADD CONSTRAINT "items_carrito_cantidad_positiva" CHECK ("cantidad" > 0);

ALTER TABLE "pedidos"
    ADD CONSTRAINT "pedidos_total_no_negativo" CHECK ("total" >= 0),
    ADD CONSTRAINT "pedidos_comprador_distinto_vendedor" CHECK ("comprador_id" <> "vendedor_id");

ALTER TABLE "detalles_pedido"
    ADD CONSTRAINT "detalles_pedido_cantidad_positiva" CHECK ("cantidad" > 0),
    ADD CONSTRAINT "detalles_pedido_precio_positivo" CHECK ("precio_unitario" > 0),
    ADD CONSTRAINT "detalles_pedido_subtotal_correcto" CHECK ("subtotal" = "cantidad" * "precio_unitario");

ALTER TABLE "pagos"
    ADD CONSTRAINT "pagos_monto_positivo" CHECK ("monto" > 0);

-- Un pedido puede tener varios intentos de pago rechazados, pero solo uno aprobado.
CREATE UNIQUE INDEX "pagos_un_aprobado_por_pedido" ON "pagos" ("pedido_id") WHERE "estado" = 'aprobado';
