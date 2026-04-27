/*
  Warnings:

  - You are about to drop the column `category` on the `groups` table. All the data in the column will be lost.

*/
-- CreateTable
CREATE TABLE "tags" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "followerCount" INTEGER NOT NULL DEFAULT 0,
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "discussions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "searchText" TEXT,
    "authorId" TEXT NOT NULL,
    "groupId" TEXT,
    "upvotes" INTEGER NOT NULL DEFAULT 0,
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "isAnonymous" BOOLEAN NOT NULL DEFAULT false,
    "isPinned" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "discussions_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "members" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "discussions_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "groups" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "discussion_votes" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "discussionId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "value" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "discussion_votes_discussionId_fkey" FOREIGN KEY ("discussionId") REFERENCES "discussions" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "discussion_votes_userId_fkey" FOREIGN KEY ("userId") REFERENCES "members" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "discussion_comments" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "content" TEXT NOT NULL,
    "discussionId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "parentId" TEXT,
    "upvotes" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "discussion_comments_discussionId_fkey" FOREIGN KEY ("discussionId") REFERENCES "discussions" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "discussion_comments_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "members" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "discussion_comments_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "discussion_comments" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "_GroupToTag" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,
    CONSTRAINT "_GroupToTag_A_fkey" FOREIGN KEY ("A") REFERENCES "groups" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_GroupToTag_B_fkey" FOREIGN KEY ("B") REFERENCES "tags" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "_DiscussionToTag" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,
    CONSTRAINT "_DiscussionToTag_A_fkey" FOREIGN KEY ("A") REFERENCES "discussions" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_DiscussionToTag_B_fkey" FOREIGN KEY ("B") REFERENCES "tags" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
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
    "messageCount" INTEGER NOT NULL DEFAULT 0,
    "lastMessageAt" DATETIME,
    "createdById" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "groups_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "members" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_groups" ("allowAnonymous", "createdAt", "createdById", "description", "id", "imageUrl", "isDefault", "isLocationBased", "isPrivate", "lastMessageAt", "location", "meetingType", "memberCount", "messageCount", "name", "requireApproval", "rules", "sortOrder", "updatedAt") SELECT "allowAnonymous", "createdAt", "createdById", "description", "id", "imageUrl", "isDefault", "isLocationBased", "isPrivate", "lastMessageAt", "location", "meetingType", "memberCount", "messageCount", "name", "requireApproval", "rules", "sortOrder", "updatedAt" FROM "groups";
DROP TABLE "groups";
ALTER TABLE "new_groups" RENAME TO "groups";
CREATE INDEX "groups_isDefault_idx" ON "groups"("isDefault");
CREATE INDEX "groups_meetingType_idx" ON "groups"("meetingType");
CREATE INDEX "groups_lastMessageAt_idx" ON "groups"("lastMessageAt");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "tags_name_key" ON "tags"("name");

-- CreateIndex
CREATE INDEX "discussions_searchText_idx" ON "discussions"("searchText");

-- CreateIndex
CREATE INDEX "discussions_createdAt_idx" ON "discussions"("createdAt");

-- CreateIndex
CREATE INDEX "discussions_groupId_idx" ON "discussions"("groupId");

-- CreateIndex
CREATE INDEX "discussions_status_idx" ON "discussions"("status");

-- CreateIndex
CREATE UNIQUE INDEX "discussion_votes_discussionId_userId_key" ON "discussion_votes"("discussionId", "userId");

-- CreateIndex
CREATE INDEX "discussion_comments_discussionId_idx" ON "discussion_comments"("discussionId");

-- CreateIndex
CREATE INDEX "discussion_comments_parentId_idx" ON "discussion_comments"("parentId");

-- CreateIndex
CREATE INDEX "discussion_comments_createdAt_idx" ON "discussion_comments"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "_GroupToTag_AB_unique" ON "_GroupToTag"("A", "B");

-- CreateIndex
CREATE INDEX "_GroupToTag_B_index" ON "_GroupToTag"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_DiscussionToTag_AB_unique" ON "_DiscussionToTag"("A", "B");

-- CreateIndex
CREATE INDEX "_DiscussionToTag_B_index" ON "_DiscussionToTag"("B");
