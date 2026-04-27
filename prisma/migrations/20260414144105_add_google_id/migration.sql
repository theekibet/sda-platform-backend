/*
  Warnings:

  - A unique constraint covering the columns `[googleId]` on the table `members` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "members" ADD COLUMN "googleId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "members_googleId_key" ON "members"("googleId");
