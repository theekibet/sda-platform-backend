/*
  Warnings:

  - You are about to drop the column `departureTime` on the `community_posts` table. All the data in the column will be lost.
  - You are about to drop the column `fromLocation` on the `community_posts` table. All the data in the column will be lost.
  - You are about to drop the column `seatsAvailable` on the `community_posts` table. All the data in the column will be lost.
  - You are about to drop the column `toLocation` on the `community_posts` table. All the data in the column will be lost.

*/
-- CreateTable
CREATE TABLE "community_reports" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "postId" TEXT NOT NULL,
    "reporterId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "reviewedById" TEXT,
    "reviewedAt" DATETIME,
    "adminNotes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "community_reports_postId_fkey" FOREIGN KEY ("postId") REFERENCES "community_posts" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "community_reports_reporterId_fkey" FOREIGN KEY ("reporterId") REFERENCES "members" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "community_reports_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "members" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

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
    "interestedCount" INTEGER NOT NULL DEFAULT 0,
    "goingCount" INTEGER NOT NULL DEFAULT 0,
    "helpingCount" INTEGER NOT NULL DEFAULT 0,
    "prayingCount" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'active',
    "expiresAt" DATETIME,
    "reportCount" INTEGER NOT NULL DEFAULT 0,
    "isFlagged" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "community_posts_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "members" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_community_posts" ("authorId", "contactEmail", "contactPhone", "createdAt", "currentAmount", "description", "eventDate", "goalAmount", "goingCount", "id", "interestedCount", "itemsNeeded", "location", "title", "type", "updatedAt") SELECT "authorId", "contactEmail", "contactPhone", "createdAt", "currentAmount", "description", "eventDate", "goalAmount", "goingCount", "id", "interestedCount", "itemsNeeded", "location", "title", "type", "updatedAt" FROM "community_posts";
DROP TABLE "community_posts";
ALTER TABLE "new_community_posts" RENAME TO "community_posts";
CREATE INDEX "community_posts_type_idx" ON "community_posts"("type");
CREATE INDEX "community_posts_status_idx" ON "community_posts"("status");
CREATE INDEX "community_posts_createdAt_idx" ON "community_posts"("createdAt");
CREATE INDEX "community_posts_expiresAt_idx" ON "community_posts"("expiresAt");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "community_reports_status_idx" ON "community_reports"("status");

-- CreateIndex
CREATE UNIQUE INDEX "community_reports_postId_reporterId_key" ON "community_reports"("postId", "reporterId");
