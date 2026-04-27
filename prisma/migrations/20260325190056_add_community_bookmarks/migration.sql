-- CreateTable
CREATE TABLE "community_bookmarks" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "community_bookmarks_userId_fkey" FOREIGN KEY ("userId") REFERENCES "members" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "community_bookmarks_postId_fkey" FOREIGN KEY ("postId") REFERENCES "community_posts" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "community_bookmarks_userId_idx" ON "community_bookmarks"("userId");

-- CreateIndex
CREATE INDEX "community_bookmarks_postId_idx" ON "community_bookmarks"("postId");

-- CreateIndex
CREATE UNIQUE INDEX "community_bookmarks_userId_postId_key" ON "community_bookmarks"("userId", "postId");
