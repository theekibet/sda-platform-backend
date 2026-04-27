/*
  Warnings:

  - You are about to drop the column `locationPrivacy` on the `members` table. All the data in the column will be lost.

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
    "locationLastUpdated" DATETIME,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastActiveAt" DATETIME,
    "isAdmin" BOOLEAN NOT NULL DEFAULT false,
    "isSuperAdmin" BOOLEAN NOT NULL DEFAULT false,
    "isSuspended" BOOLEAN NOT NULL DEFAULT false,
    "suspendedUntil" DATETIME,
    "suspensionReason" TEXT,
    "resetToken" TEXT,
    "resetTokenExpiry" DATETIME,
    "adminNotes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_members" ("adminNotes", "age", "avatarUrl", "bio", "createdAt", "email", "gender", "id", "isActive", "isAdmin", "isSuperAdmin", "isSuspended", "lastActiveAt", "latitude", "locationLastUpdated", "locationName", "longitude", "name", "password", "phone", "resetToken", "resetTokenExpiry", "suspendedUntil", "suspensionReason", "updatedAt") SELECT "adminNotes", "age", "avatarUrl", "bio", "createdAt", "email", "gender", "id", "isActive", "isAdmin", "isSuperAdmin", "isSuspended", "lastActiveAt", "latitude", "locationLastUpdated", "locationName", "longitude", "name", "password", "phone", "resetToken", "resetTokenExpiry", "suspendedUntil", "suspensionReason", "updatedAt" FROM "members";
DROP TABLE "members";
ALTER TABLE "new_members" RENAME TO "members";
CREATE UNIQUE INDEX "members_email_key" ON "members"("email");
CREATE UNIQUE INDEX "members_phone_key" ON "members"("phone");
CREATE UNIQUE INDEX "members_resetToken_key" ON "members"("resetToken");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
