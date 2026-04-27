/*
  Warnings:

  - You are about to drop the `churches` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the column `churchId` on the `members` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "churches_name_key";

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "churches";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "verse_likes" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "verseId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "verse_likes_verseId_fkey" FOREIGN KEY ("verseId") REFERENCES "bible_verses" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "verse_likes_userId_fkey" FOREIGN KEY ("userId") REFERENCES "members" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "verse_bookmarks" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "verseId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "verse_bookmarks_verseId_fkey" FOREIGN KEY ("verseId") REFERENCES "bible_verses" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "verse_bookmarks_userId_fkey" FOREIGN KEY ("userId") REFERENCES "members" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "verse_comments" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "verseId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "verse_comments_verseId_fkey" FOREIGN KEY ("verseId") REFERENCES "bible_verses" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "verse_comments_userId_fkey" FOREIGN KEY ("userId") REFERENCES "members" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

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
    "city" TEXT,
    "region" TEXT,
    "country" TEXT,
    "showLocation" BOOLEAN NOT NULL DEFAULT true,
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
INSERT INTO "new_members" ("adminNotes", "age", "avatarUrl", "bio", "city", "country", "createdAt", "email", "gender", "id", "isActive", "isAdmin", "isSuspended", "lastActiveAt", "name", "password", "phone", "region", "resetToken", "resetTokenExpiry", "showLocation", "suspendedUntil", "suspensionReason", "updatedAt") SELECT "adminNotes", "age", "avatarUrl", "bio", "city", "country", "createdAt", "email", "gender", "id", "isActive", "isAdmin", "isSuspended", "lastActiveAt", "name", "password", "phone", "region", "resetToken", "resetTokenExpiry", "showLocation", "suspendedUntil", "suspensionReason", "updatedAt" FROM "members";
DROP TABLE "members";
ALTER TABLE "new_members" RENAME TO "members";
CREATE UNIQUE INDEX "members_email_key" ON "members"("email");
CREATE UNIQUE INDEX "members_phone_key" ON "members"("phone");
CREATE UNIQUE INDEX "members_resetToken_key" ON "members"("resetToken");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "verse_likes_verseId_userId_key" ON "verse_likes"("verseId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "verse_bookmarks_verseId_userId_key" ON "verse_bookmarks"("verseId", "userId");
