-- CreateTable
CREATE TABLE "public"."law_snapshots" (
    "id" TEXT NOT NULL,
    "lawId" TEXT NOT NULL,
    "contentHash" TEXT NOT NULL,
    "metadata" JSONB,
    "lastContent" TEXT,
    "version" TEXT,
    "lastChecked" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "law_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "law_snapshots_lawId_key" ON "public"."law_snapshots"("lawId");

-- CreateIndex
CREATE INDEX "law_snapshots_lawId_idx" ON "public"."law_snapshots"("lawId");

-- CreateIndex
CREATE INDEX "law_snapshots_lastChecked_idx" ON "public"."law_snapshots"("lastChecked");
