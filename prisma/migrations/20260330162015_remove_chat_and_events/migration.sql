/*
  Warnings:

  - You are about to drop the `group_event_attendees` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `group_events` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `group_messages` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `message_reactions` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the column `isMuted` on the `group_members` table. All the data in the column will be lost.
  - You are about to drop the column `lastReadAt` on the `group_members` table. All the data in the column will be lost.
  - You are about to drop the column `lastMessageAt` on the `groups` table. All the data in the column will be lost.
  - You are about to drop the column `messageCount` on the `groups` table. All the data in the column will be lost.
  - You are about to drop the column `groupMessages` on the `notification_preferences` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "group_event_attendees_eventId_memberId_key";

-- DropIndex
DROP INDEX "group_messages_isPinned_idx";

-- DropIndex
DROP INDEX "group_messages_authorId_idx";

-- DropIndex
DROP INDEX "group_messages_groupId_createdAt_idx";

-- DropIndex
DROP INDEX "message_reactions_messageId_userId_reaction_key";

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "group_event_attendees";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "group_events";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "group_messages";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "message_reactions";
PRAGMA foreign_keys=on;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_group_members" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "groupId" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'member',
    "status" TEXT NOT NULL DEFAULT 'pending',
    "joinedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "group_members_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "groups" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "group_members_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "members" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_group_members" ("groupId", "id", "joinedAt", "memberId", "role", "status") SELECT "groupId", "id", "joinedAt", "memberId", "role", "status" FROM "group_members";
DROP TABLE "group_members";
ALTER TABLE "new_group_members" RENAME TO "group_members";
CREATE UNIQUE INDEX "group_members_groupId_memberId_key" ON "group_members"("groupId", "memberId");
CREATE TABLE "new_groups" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "isPrivate" BOOLEAN NOT NULL DEFAULT false,
    "location" TEXT,
    "imageUrl" TEXT,
    "rules" TEXT,
    "requireApproval" BOOLEAN NOT NULL DEFAULT false,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "allowAnonymous" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER,
    "isLocationBased" BOOLEAN NOT NULL DEFAULT false,
    "meetingType" TEXT NOT NULL DEFAULT 'online',
    "memberCount" INTEGER NOT NULL DEFAULT 0,
    "discussionCount" INTEGER NOT NULL DEFAULT 0,
    "createdById" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "groups_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "members" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_groups" ("allowAnonymous", "createdAt", "createdById", "description", "id", "imageUrl", "isDefault", "isLocationBased", "isPrivate", "location", "meetingType", "memberCount", "name", "requireApproval", "rules", "sortOrder", "updatedAt") SELECT "allowAnonymous", "createdAt", "createdById", "description", "id", "imageUrl", "isDefault", "isLocationBased", "isPrivate", "location", "meetingType", "memberCount", "name", "requireApproval", "rules", "sortOrder", "updatedAt" FROM "groups";
DROP TABLE "groups";
ALTER TABLE "new_groups" RENAME TO "groups";
CREATE INDEX "groups_isDefault_idx" ON "groups"("isDefault");
CREATE INDEX "groups_meetingType_idx" ON "groups"("meetingType");
CREATE TABLE "new_notification_preferences" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "emailEnabled" BOOLEAN NOT NULL DEFAULT true,
    "inAppEnabled" BOOLEAN NOT NULL DEFAULT true,
    "discussionReplies" BOOLEAN NOT NULL DEFAULT true,
    "discussionUpvotes" BOOLEAN NOT NULL DEFAULT true,
    "discussionMentions" BOOLEAN NOT NULL DEFAULT true,
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
INSERT INTO "new_notification_preferences" ("announcements", "communityPosts", "communityResponses", "createdAt", "digestFrequency", "emailEnabled", "groupInvites", "id", "inAppEnabled", "lastDigestSent", "postMentions", "prayerResponses", "quietHoursEnabled", "quietHoursEnd", "quietHoursStart", "updatedAt", "userId", "versePublished") SELECT "announcements", "communityPosts", "communityResponses", "createdAt", "digestFrequency", "emailEnabled", "groupInvites", "id", "inAppEnabled", "lastDigestSent", "postMentions", "prayerResponses", "quietHoursEnabled", "quietHoursEnd", "quietHoursStart", "updatedAt", "userId", "versePublished" FROM "notification_preferences";
DROP TABLE "notification_preferences";
ALTER TABLE "new_notification_preferences" RENAME TO "notification_preferences";
CREATE UNIQUE INDEX "notification_preferences_userId_key" ON "notification_preferences"("userId");
CREATE INDEX "notification_preferences_userId_idx" ON "notification_preferences"("userId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
