-- AlterTable
ALTER TABLE "Presence" ADD COLUMN "fingerprint" TEXT;

-- CreateTable
CREATE TABLE "DeviceModeration" (
    "fingerprint" TEXT NOT NULL,
    "reportCount" INTEGER NOT NULL DEFAULT 0,
    "bannedUntil" TIMESTAMP(3),
    "permanentBan" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DeviceModeration_pkey" PRIMARY KEY ("fingerprint")
);

-- CreateTable
CREATE TABLE "UserReport" (
    "id" TEXT NOT NULL,
    "reporterSessionId" TEXT NOT NULL,
    "reportedSessionId" TEXT NOT NULL,
    "reportedFingerprint" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "details" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserReport_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "UserReport_reportedFingerprint_idx" ON "UserReport"("reportedFingerprint");

-- CreateIndex
CREATE UNIQUE INDEX "UserReport_reporterSessionId_reportedSessionId_key" ON "UserReport"("reporterSessionId", "reportedSessionId");
