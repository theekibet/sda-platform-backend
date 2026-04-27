-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_notification_preferences" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "emailEnabled" BOOLEAN NOT NULL DEFAULT true,
    "inAppEnabled" BOOLEAN NOT NULL DEFAULT true,
    "groupMessages" BOOLEAN NOT NULL DEFAULT true,
    "prayerResponses" BOOLEAN NOT NULL DEFAULT true,
    "versePublished" BOOLEAN NOT NULL DEFAULT true,
    "groupInvites" BOOLEAN NOT NULL DEFAULT true,
    "announcements" BOOLEAN NOT NULL DEFAULT true,
    "communityPosts" BOOLEAN NOT NULL DEFAULT true,
    "communityResponses" BOOLEAN NOT NULL DEFAULT true,
    "postMentions" BOOLEAN NOT NULL DEFAULT true,
    "digestFrequency" TEXT NOT NULL DEFAULT 'daily',
    "lastDigestSent" DATETIME,
    "quietHoursEnabled" BOOLEAN NOT NULL DEFAULT false,
    "quietHoursStart" INTEGER,
    "quietHoursEnd" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "notification_preferences_userId_fkey" FOREIGN KEY ("userId") REFERENCES "members" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_notification_preferences" ("announcements", "createdAt", "emailEnabled", "groupInvites", "groupMessages", "id", "inAppEnabled", "prayerResponses", "quietHoursEnabled", "quietHoursEnd", "quietHoursStart", "updatedAt", "userId", "versePublished") SELECT "announcements", "createdAt", "emailEnabled", "groupInvites", "groupMessages", "id", "inAppEnabled", "prayerResponses", "quietHoursEnabled", "quietHoursEnd", "quietHoursStart", "updatedAt", "userId", "versePublished" FROM "notification_preferences";
DROP TABLE "notification_preferences";
ALTER TABLE "new_notification_preferences" RENAME TO "notification_preferences";
CREATE UNIQUE INDEX "notification_preferences_userId_key" ON "notification_preferences"("userId");
CREATE INDEX "notification_preferences_userId_idx" ON "notification_preferences"("userId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
