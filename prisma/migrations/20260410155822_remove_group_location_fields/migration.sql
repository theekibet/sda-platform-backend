/*
  Warnings:

  - You are about to drop the column `isLocationBased` on the `groups` table. All the data in the column will be lost.
  - You are about to drop the column `location` on the `groups` table. All the data in the column will be lost.
  - You are about to drop the column `meetingType` on the `groups` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_groups" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "isPrivate" BOOLEAN NOT NULL DEFAULT false,
    "imageUrl" TEXT,
    "rules" TEXT,
    "requireApproval" BOOLEAN NOT NULL DEFAULT false,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "allowAnonymous" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER,
    "memberCount" INTEGER NOT NULL DEFAULT 0,
    "discussionCount" INTEGER NOT NULL DEFAULT 0,
    "createdById" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "groups_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "members" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_groups" ("allowAnonymous", "createdAt", "createdById", "description", "discussionCount", "id", "imageUrl", "isDefault", "isPrivate", "memberCount", "name", "requireApproval", "rules", "sortOrder", "updatedAt") SELECT "allowAnonymous", "createdAt", "createdById", "description", "discussionCount", "id", "imageUrl", "isDefault", "isPrivate", "memberCount", "name", "requireApproval", "rules", "sortOrder", "updatedAt" FROM "groups";
DROP TABLE "groups";
ALTER TABLE "new_groups" RENAME TO "groups";
CREATE INDEX "groups_isDefault_idx" ON "groups"("isDefault");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
