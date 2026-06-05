-- AlterTable
ALTER TABLE "products" ADD COLUMN     "detail_blocks" JSONB,
ADD COLUMN     "highlights" JSONB,
ADD COLUMN     "tagline" TEXT;
