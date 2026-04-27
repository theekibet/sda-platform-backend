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
INSERT INTO "new_members" ("adminNotes", "age", "avatarUrl", "bio", "city", "country", "createdAt", "email", "gender", "id", "isActive", "isAdmin", "isSuspended", "lastActiveAt", "name", "password", "phone", "region", "resetToken", "resetTokenExpiry", "showLocation", "suspendedUntil", "suspensionReason", "updatedAt") SELECT "adminNotes", "age", "avatarUrl", "bio", "city", "country", "createdAt", "email", "gender", "id", "isActive", "isAdmin", "isSuspended", "lastActiveAt", "name", "password", "phone", "region", "resetToken", "resetTokenExpiry", "showLocation", "suspendedUntil", "suspensionReason", "updatedAt" FROM "members";
DROP TABLE "members";
ALTER TABLE "new_members" RENAME TO "members";
CREATE UNIQUE INDEX "members_email_key" ON "members"("email");
CREATE UNIQUE INDEX "members_phone_key" ON "members"("phone");
CREATE UNIQUE INDEX "members_resetToken_key" ON "members"("resetToken");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
