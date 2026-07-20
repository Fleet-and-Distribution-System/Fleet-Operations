-- CreateTable
CREATE TABLE "TripCheckpoint" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "tripId" TEXT NOT NULL,
    "note" TEXT NOT NULL,
    "location" TEXT,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TripCheckpoint_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TripCheckpoint_companyId_idx" ON "TripCheckpoint"("companyId");

-- CreateIndex
CREATE INDEX "TripCheckpoint_tripId_idx" ON "TripCheckpoint"("tripId");

-- AddForeignKey
ALTER TABLE "TripCheckpoint" ADD CONSTRAINT "TripCheckpoint_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TripCheckpoint" ADD CONSTRAINT "TripCheckpoint_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "Trip"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
