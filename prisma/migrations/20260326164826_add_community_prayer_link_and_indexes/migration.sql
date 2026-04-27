-- AlterTable
ALTER TABLE "community_posts" ADD COLUMN "prayerRequestId" TEXT;

-- AlterTable
ALTER TABLE "prayer_requests" ADD COLUMN "sharedToCommunityAt" DATETIME;

-- CreateIndex
CREATE INDEX "community_posts_status_expiresAt_idx" ON "community_posts"("status", "expiresAt");

-- CreateIndex
CREATE INDEX "members_latitude_longitude_idx" ON "members"("latitude", "longitude");

-- CreateIndex
CREATE INDEX "prayer_requests_sharedToCommunityAt_idx" ON "prayer_requests"("sharedToCommunityAt");
