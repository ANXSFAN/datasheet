-- CreateTable
CREATE TABLE "attribute_definitions" (
    "id" TEXT NOT NULL,
    "factory_id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "name_i18n" JSONB,
    "unit" TEXT,
    "type" TEXT NOT NULL DEFAULT 'text',
    "options" JSONB,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "attribute_definitions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "attribute_definitions_factory_id_idx" ON "attribute_definitions"("factory_id");

-- CreateIndex
CREATE UNIQUE INDEX "attribute_definitions_factory_id_key_key" ON "attribute_definitions"("factory_id", "key");

-- AddForeignKey
ALTER TABLE "attribute_definitions" ADD CONSTRAINT "attribute_definitions_factory_id_fkey" FOREIGN KEY ("factory_id") REFERENCES "factories"("id") ON DELETE CASCADE ON UPDATE CASCADE;
