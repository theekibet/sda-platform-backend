/*
  Warnings:

  - A unique constraint covering the columns `[username]` on the table `members` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "members" ADD COLUMN "lastUsernameChange" DATETIME;
ALTER TABLE "members" ADD COLUMN "username" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "members_username_key" ON "members"("username");
