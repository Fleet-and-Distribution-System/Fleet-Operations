/*
  Warnings:

  - The `type` column on the `Location` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "Location" DROP COLUMN "type",
ADD COLUMN     "type" TEXT DEFAULT 'Other';

-- DropEnum
DROP TYPE "LocationType";
