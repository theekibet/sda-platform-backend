/*
  Warnings:

  - You are about to drop the column `city` on the `members` table. All the data in the column will be lost.
  - You are about to drop the column `country` on the `members` table. All the data in the column will be lost.
  - You are about to drop the column `region` on the `members` table. All the data in the column will be lost.
  - You are about to drop the column `showLocation` on the `members` table. All the data in the column will be lost.
  - You are about to drop the column `city` on the `prayer_requests` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_members" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "password" TEXT NOT NULL,
    "avatarUrl" TEXT,
    "bio" TEXT,
    "age" INTEGER,
    "gender" TEXT,
    "locationName" TEXT,
    "latitude" REAL,
    "longitude" REAL,
    "locationPrivacy" TEXT NOT NULL DEFAULT 'city',
    "locationLastUpdated" DATETIME,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastActiveAt" DATETIME,
    "isAdmin" BOOLEAN NOT NULL DEFAULT false,
    "isSuspended" BOOLEAN NOT NULL DEFAULT false,
    "suspendedUntil" DATETIME,
    "suspensionReason" TEXT,
    "resetToken" TEXT,
    "resetTokenExpiry" DATETIME,
    "adminNotes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_members" ("adminNotes", "age", "avatarUrl", "bio", "createdAt", "email", "gender", "id", "isActive", "isAdmin", "isSuspended", "lastActiveAt", "locationLastUpdated", "locationPrivacy", "name", "password", "phone", "resetToken", "resetTokenExpiry", "suspendedUntil", "suspensionReason", "updatedAt") SELECT "adminNotes", "age", "avatarUrl", "bio", "createdAt", "email", "gender", "id", "isActive", "isAdmin", "isSuspended", "lastActiveAt", "locationLastUpdated", "locationPrivacy", "name", "password", "phone", "resetToken", "resetTokenExpiry", "suspendedUntil", "suspensionReason", "updatedAt" FROM "members";
DROP TABLE "members";
ALTER TABLE "new_members" RENAME TO "members";
CREATE UNIQUE INDEX "members_email_key" ON "members"("email");
CREATE UNIQUE INDEX "members_phone_key" ON "members"("phone");
CREATE UNIQUE INDEX "members_resetToken_key" ON "members"("resetToken");
CREATE TABLE "new_prayer_requests" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "content" TEXT NOT NULL,
    "authorId" TEXT,
    "isAnonymous" BOOLEAN NOT NULL DEFAULT false,
    "locationName" TEXT,
    "prayedCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "prayer_requests_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "members" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_prayer_requests" ("authorId", "content", "createdAt", "id", "isAnonymous", "prayedCount", "updatedAt") SELECT "authorId", "content", "createdAt", "id", "isAnonymous", "prayedCount", "updatedAt" FROM "prayer_requests";
DROP TABLE "prayer_requests";
ALTER TABLE "new_prayer_requests" RENAME TO "prayer_requests";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
