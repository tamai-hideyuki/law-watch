-- CreateTable
CREATE TABLE "public"."law_registry_snapshots" (
    "id" TEXT NOT NULL,
    "snapshotDate" TIMESTAMP(3) NOT NULL,
    "totalLawCount" INTEGER NOT NULL,
    "lawsChecksum" TEXT NOT NULL,
    "metadata" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "law_registry_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."law_registry_diffs" (
    "id" TEXT NOT NULL,
    "previousSnapshotId" TEXT NOT NULL,
    "currentSnapshotId" TEXT NOT NULL,
    "detectedAt" TIMESTAMP(3) NOT NULL,
    "diffData" JSONB NOT NULL,
    "summary" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "law_registry_diffs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."comprehensive_monitoring" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "settings" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastCheckAt" TIMESTAMP(3),

    CONSTRAINT "comprehensive_monitoring_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."comprehensive_notifications" (
    "id" TEXT NOT NULL,
    "monitoringId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "diffData" JSONB NOT NULL,
    "notificationType" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "readAt" TIMESTAMP(3),

    CONSTRAINT "comprehensive_notifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "law_registry_snapshots_snapshotDate_idx" ON "public"."law_registry_snapshots"("snapshotDate");

-- CreateIndex
CREATE INDEX "law_registry_diffs_detectedAt_idx" ON "public"."law_registry_diffs"("detectedAt");

-- CreateIndex
CREATE INDEX "law_registry_diffs_previousSnapshotId_idx" ON "public"."law_registry_diffs"("previousSnapshotId");

-- CreateIndex
CREATE INDEX "law_registry_diffs_currentSnapshotId_idx" ON "public"."law_registry_diffs"("currentSnapshotId");

-- CreateIndex
CREATE INDEX "comprehensive_monitoring_userId_idx" ON "public"."comprehensive_monitoring"("userId");

-- CreateIndex
CREATE INDEX "comprehensive_monitoring_isActive_idx" ON "public"."comprehensive_monitoring"("isActive");

-- CreateIndex
CREATE INDEX "comprehensive_monitoring_lastCheckAt_idx" ON "public"."comprehensive_monitoring"("lastCheckAt");

-- CreateIndex
CREATE INDEX "comprehensive_notifications_userId_isRead_idx" ON "public"."comprehensive_notifications"("userId", "isRead");

-- CreateIndex
CREATE INDEX "comprehensive_notifications_monitoringId_idx" ON "public"."comprehensive_notifications"("monitoringId");

-- CreateIndex
CREATE INDEX "comprehensive_notifications_createdAt_idx" ON "public"."comprehensive_notifications"("createdAt");

-- AddForeignKey
ALTER TABLE "public"."law_registry_diffs" ADD CONSTRAINT "law_registry_diffs_previousSnapshotId_fkey" FOREIGN KEY ("previousSnapshotId") REFERENCES "public"."law_registry_snapshots"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."law_registry_diffs" ADD CONSTRAINT "law_registry_diffs_currentSnapshotId_fkey" FOREIGN KEY ("currentSnapshotId") REFERENCES "public"."law_registry_snapshots"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."comprehensive_notifications" ADD CONSTRAINT "comprehensive_notifications_monitoringId_fkey" FOREIGN KEY ("monitoringId") REFERENCES "public"."comprehensive_monitoring"("id") ON DELETE CASCADE ON UPDATE CASCADE;
