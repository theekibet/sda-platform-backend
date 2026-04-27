-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_groups" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "isPrivate" BOOLEAN NOT NULL DEFAULT false,
    "location" TEXT,
    "imageUrl" TEXT,
    "rules" TEXT,
    "requireApproval" BOOLEAN NOT NULL DEFAULT true,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "allowAnonymous" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER,
    "isLocationBased" BOOLEAN NOT NULL DEFAULT false,
    "meetingType" TEXT NOT NULL DEFAULT 'online',
    "memberCount" INTEGER NOT NULL DEFAULT 0,
    "createdById" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "groups_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "members" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_groups" ("allowAnonymous", "category", "createdAt", "createdById", "description", "id", "imageUrl", "isDefault", "isPrivate", "location", "memberCount", "name", "requireApproval", "rules", "sortOrder", "updatedAt") SELECT "allowAnonymous", "category", "createdAt", "createdById", "description", "id", "imageUrl", "isDefault", "isPrivate", "location", "memberCount", "name", "requireApproval", "rules", "sortOrder", "updatedAt" FROM "groups";
DROP TABLE "groups";
ALTER TABLE "new_groups" RENAME TO "groups";
CREATE INDEX "groups_category_idx" ON "groups"("category");
CREATE INDEX "groups_isDefault_idx" ON "groups"("isDefault");
CREATE INDEX "groups_meetingType_idx" ON "groups"("meetingType");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
