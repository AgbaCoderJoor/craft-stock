-- Multi-tenant conversion. Hand-edited: existing rows are backfilled to
-- business #1 (Larah's) before the NOT NULL constraints are applied, so this
-- migration is safe on a populated database.

-- CreateEnum
CREATE TYPE "BusinessStatus" AS ENUM ('pending', 'active', 'suspended');

-- CreateEnum
CREATE TYPE "TokenType" AS ENUM ('EMAIL_VERIFICATION', 'PASSWORD_RESET');

-- CreateTable
CREATE TABLE "Business" (
    "business_id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "status" "BusinessStatus" NOT NULL DEFAULT 'pending',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Business_pkey" PRIMARY KEY ("business_id")
);

-- CreateTable
CREATE TABLE "AuthToken" (
    "token_id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "token_hash" TEXT NOT NULL,
    "type" "TokenType" NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "used_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuthToken_pkey" PRIMARY KEY ("token_id")
);

-- Tenant #1: all pre-existing data belongs to Larah's business
INSERT INTO "Business" ("name", "slug", "status")
VALUES ('Larah''s Inventory', 'larahs-inventory', 'active');

-- AlterTable: add columns as nullable first
ALTER TABLE "User" ADD COLUMN "business_id" INTEGER,
ADD COLUMN "email_verified" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Material" ADD COLUMN "business_id" INTEGER;
ALTER TABLE "FinishedGood" ADD COLUMN "business_id" INTEGER;
ALTER TABLE "StockMovement" ADD COLUMN "business_id" INTEGER;
ALTER TABLE "AuditLog" ADD COLUMN "business_id" INTEGER;

-- Backfill existing rows to tenant #1; pre-existing users are trusted as verified
UPDATE "User" SET
  "business_id" = (SELECT "business_id" FROM "Business" WHERE "slug" = 'larahs-inventory'),
  "email_verified" = true;
UPDATE "Material" SET "business_id" = (SELECT "business_id" FROM "Business" WHERE "slug" = 'larahs-inventory');
UPDATE "FinishedGood" SET "business_id" = (SELECT "business_id" FROM "Business" WHERE "slug" = 'larahs-inventory');
UPDATE "StockMovement" SET "business_id" = (SELECT "business_id" FROM "Business" WHERE "slug" = 'larahs-inventory');
UPDATE "AuditLog" SET "business_id" = (SELECT "business_id" FROM "Business" WHERE "slug" = 'larahs-inventory');

-- Enforce NOT NULL now that every row has a tenant
ALTER TABLE "User" ALTER COLUMN "business_id" SET NOT NULL;
ALTER TABLE "Material" ALTER COLUMN "business_id" SET NOT NULL;
ALTER TABLE "FinishedGood" ALTER COLUMN "business_id" SET NOT NULL;
ALTER TABLE "StockMovement" ALTER COLUMN "business_id" SET NOT NULL;
ALTER TABLE "AuditLog" ALTER COLUMN "business_id" SET NOT NULL;

-- DropIndex: SKU uniqueness becomes per-business
DROP INDEX "FinishedGood_sku_key";

-- CreateIndex
CREATE UNIQUE INDEX "Business_slug_key" ON "Business"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "AuthToken_token_hash_key" ON "AuthToken"("token_hash");

-- CreateIndex
CREATE INDEX "AuthToken_user_id_type_idx" ON "AuthToken"("user_id", "type");

-- CreateIndex
CREATE INDEX "AuditLog_business_id_idx" ON "AuditLog"("business_id");

-- CreateIndex
CREATE INDEX "FinishedGood_business_id_idx" ON "FinishedGood"("business_id");

-- CreateIndex
CREATE UNIQUE INDEX "FinishedGood_business_id_sku_key" ON "FinishedGood"("business_id", "sku");

-- CreateIndex
CREATE INDEX "Material_business_id_idx" ON "Material"("business_id");

-- CreateIndex
CREATE INDEX "StockMovement_business_id_idx" ON "StockMovement"("business_id");

-- CreateIndex
CREATE INDEX "User_business_id_idx" ON "User"("business_id");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "Business"("business_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuthToken" ADD CONSTRAINT "AuthToken_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Material" ADD CONSTRAINT "Material_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "Business"("business_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinishedGood" ADD CONSTRAINT "FinishedGood_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "Business"("business_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockMovement" ADD CONSTRAINT "StockMovement_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "Business"("business_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "Business"("business_id") ON DELETE CASCADE ON UPDATE CASCADE;
