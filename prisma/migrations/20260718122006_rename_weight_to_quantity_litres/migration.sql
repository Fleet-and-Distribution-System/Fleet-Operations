/*
  Warnings:

  - You are about to drop the column `weightKg` on the `TransportOrder` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "TransportOrder" DROP COLUMN "weightKg",
ADD COLUMN     "quantityLitres" DOUBLE PRECISION;
