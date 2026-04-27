-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_members" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "googleId" TEXT,
    "name" TEXT NOT NULL,
    "username" TEXT,
    "lastUsernameChange" DATETIME,
    "email" TEXT,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "emailVerificationToken" TEXT,
    "emailVerificationExpires" DATETIME,
    "phone" TEXT,
    "password" TEXT NOT NULL,
    "avatarUrl" TEXT,
    "authProvider" TEXT NOT NULL DEFAULT 'email',
    "lastLoginAt" DATETIME,
    "lastLoginMethod" TEXT,
    "bio" TEXT,
    "age" INTEGER,
    "dateOfBirth" DATETIME,
    "gender" TEXT,
    "locationName" TEXT,
    "latitude" REAL,
    "longitude" REAL,
    "locationLastUpdated" DATETIME,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastActiveAt" DATETIME,
    "isModerator" BOOLEAN NOT NULL DEFAULT false,
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
INSERT INTO "new_members" ("adminNotes", "age", "avatarUrl", "bio", "createdAt", "dateOfBirth", "email", "emailVerificationExpires", "emailVerificationToken", "emailVerified", "gender", "googleId", "id", "isActive", "isModerator", "isSuperAdmin", "isSuspended", "lastActiveAt", "lastUsernameChange", "latitude", "locationLastUpdated", "locationName", "longitude", "name", "password", "phone", "resetToken", "resetTokenExpiry", "suspendedUntil", "suspensionReason", "updatedAt", "username") SELECT "adminNotes", "age", "avatarUrl", "bio", "createdAt", "dateOfBirth", "email", "emailVerificationExpires", "emailVerificationToken", "emailVerified", "gender", "googleId", "id", "isActive", "isModerator", "isSuperAdmin", "isSuspended", "lastActiveAt", "lastUsernameChange", "latitude", "locationLastUpdated", "locationName", "longitude", "name", "password", "phone", "resetToken", "resetTokenExpiry", "suspendedUntil", "suspensionReason", "updatedAt", "username" FROM "members";
DROP TABLE "members";
ALTER TABLE "new_members" RENAME TO "members";
CREATE UNIQUE INDEX "members_googleId_key" ON "members"("googleId");
CREATE UNIQUE INDEX "members_username_key" ON "members"("username");
CREATE UNIQUE INDEX "members_email_key" ON "members"("email");
CREATE UNIQUE INDEX "members_emailVerificationToken_key" ON "members"("emailVerificationToken");
CREATE UNIQUE INDEX "members_phone_key" ON "members"("phone");
CREATE UNIQUE INDEX "members_resetToken_key" ON "members"("resetToken");
CREATE INDEX "members_latitude_longitude_idx" ON "members"("latitude", "longitude");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
