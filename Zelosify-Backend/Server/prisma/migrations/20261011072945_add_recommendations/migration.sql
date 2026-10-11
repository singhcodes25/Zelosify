-- CreateTable
CREATE TABLE "Recommendation" (
    "id" TEXT NOT NULL,
    "profileId" INTEGER NOT NULL,
    "openingId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "skillMatchScore" DOUBLE PRECISION NOT NULL,
    "experienceMatchScore" DOUBLE PRECISION NOT NULL,
    "locationMatchScore" DOUBLE PRECISION NOT NULL,
    "finalScore" DOUBLE PRECISION NOT NULL,
    "decision" TEXT NOT NULL,
    "explanation" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Recommendation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Recommendation_tenantId_idx" ON "Recommendation"("tenantId");

-- CreateIndex
CREATE INDEX "Recommendation_openingId_decision_idx" ON "Recommendation"("openingId", "decision");

-- CreateIndex
CREATE UNIQUE INDEX "Recommendation_profileId_openingId_key" ON "Recommendation"("profileId", "openingId");

-- AddForeignKey
ALTER TABLE "Recommendation" ADD CONSTRAINT "Recommendation_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "hiringProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Recommendation" ADD CONSTRAINT "Recommendation_openingId_fkey" FOREIGN KEY ("openingId") REFERENCES "Opening"("id") ON DELETE CASCADE ON UPDATE CASCADE;
