/*
  Warnings:

  - You are about to drop the `event_attendees` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `events` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropIndex
DROP INDEX "audit_logs_entity_entityId_idx";

-- DropIndex
DROP INDEX "groups_sortOrder_idx";

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "event_attendees";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "events";
PRAGMA foreign_keys=on;
