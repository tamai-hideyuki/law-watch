-- CreateTable
CREATE TABLE "public"."laws" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "promulgationDate" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "laws_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."watch_lists" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "watch_lists_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."watch_list_laws" (
    "watchListId" TEXT NOT NULL,
    "lawId" TEXT NOT NULL,
    "addedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "watch_list_laws_pkey" PRIMARY KEY ("watchListId","lawId")
);

-- CreateTable
CREATE TABLE "public"."notifications" (
    "id" TEXT NOT NULL,
    "lawId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "changeType" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "detectedAt" TIMESTAMP(3) NOT NULL,
    "readAt" TIMESTAMP(3),

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."law_change_histories" (
    "id" TEXT NOT NULL,
    "lawId" TEXT NOT NULL,
    "changeType" TEXT NOT NULL,
    "changeDetails" TEXT,
    "previousValue" TEXT,
    "newValue" TEXT,
    "detectedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "law_change_histories_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "watch_lists_userId_idx" ON "public"."watch_lists"("userId");

-- CreateIndex
CREATE INDEX "notifications_userId_isRead_idx" ON "public"."notifications"("userId", "isRead");

-- CreateIndex
CREATE INDEX "notifications_lawId_idx" ON "public"."notifications"("lawId");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "public"."users"("email");

-- CreateIndex
CREATE INDEX "law_change_histories_lawId_idx" ON "public"."law_change_histories"("lawId");

-- AddForeignKey
ALTER TABLE "public"."watch_list_laws" ADD CONSTRAINT "watch_list_laws_watchListId_fkey" FOREIGN KEY ("watchListId") REFERENCES "public"."watch_lists"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."watch_list_laws" ADD CONSTRAINT "watch_list_laws_lawId_fkey" FOREIGN KEY ("lawId") REFERENCES "public"."laws"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."notifications" ADD CONSTRAINT "notifications_lawId_fkey" FOREIGN KEY ("lawId") REFERENCES "public"."laws"("id") ON DELETE CASCADE ON UPDATE CASCADE;
