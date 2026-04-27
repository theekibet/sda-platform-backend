/*
  Warnings:

  - You are about to drop the column `goingCount` on the `community_posts` table. All the data in the column will be lost.
  - You are about to drop the column `helpingCount` on the `community_posts` table. All the data in the column will be lost.
  - You are about to drop the column `interestedCount` on the `community_posts` table. All the data in the column will be lost.
  - You are about to drop the column `prayingCount` on the `community_posts` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_community_posts" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "authorId" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'general',
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "eventDate" DATETIME,
    "location" TEXT,
    "goalAmount" REAL,
    "currentAmount" REAL DEFAULT 0,
    "itemsNeeded" TEXT,
    "contactPhone" TEXT,
    "contactEmail" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "expiresAt" DATETIME,
    "reportCount" INTEGER NOT NULL DEFAULT 0,
    "isFlagged" BOOLEAN NOT NULL DEFAULT false,
    "prayerRequestId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "community_posts_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "members" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_community_posts" ("authorId", "contactEmail", "contactPhone", "createdAt", "currentAmount", "description", "eventDate", "expiresAt", "goalAmount", "id", "isFlagged", "itemsNeeded", "location", "prayerRequestId", "reportCount", "status", "title", "type", "updatedAt") SELECT "authorId", "contactEmail", "contactPhone", "createdAt", "currentAmount", "description", "eventDate", "expiresAt", "goalAmount", "id", "isFlagged", "itemsNeeded", "location", "prayerRequestId", "reportCount", "status", "title", "type", "updatedAt" FROM "community_posts";
DROP TABLE "community_posts";
ALTER TABLE "new_community_posts" RENAME TO "community_posts";
CREATE INDEX "community_posts_type_idx" ON "community_posts"("type");
CREATE INDEX "community_posts_status_idx" ON "community_posts"("status");
CREATE INDEX "community_posts_createdAt_idx" ON "community_posts"("createdAt");
CREATE INDEX "community_posts_expiresAt_idx" ON "community_posts"("expiresAt");
CREATE INDEX "community_posts_status_expiresAt_idx" ON "community_posts"("status", "expiresAt");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
