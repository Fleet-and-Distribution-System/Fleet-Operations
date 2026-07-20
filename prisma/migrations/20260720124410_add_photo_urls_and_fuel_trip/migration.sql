-- AlterTable
ALTER TABLE "Driver" ADD COLUMN     "photoUrl" TEXT;

-- AlterTable
ALTER TABLE "FuelLog" ADD COLUMN     "tripId" TEXT;

-- AlterTable
ALTER TABLE "Vehicle" ADD COLUMN     "photoUrl" TEXT;

-- CreateIndex
CREATE INDEX "FuelLog_tripId_idx" ON "FuelLog"("tripId");

-- AddForeignKey
ALTER TABLE "FuelLog" ADD CONSTRAINT "FuelLog_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "Trip"("id") ON DELETE SET NULL ON UPDATE CASCADE;
