-- AlterTable: Add new columns to tasks table for self-referential relationship
ALTER TABLE "tasks" ADD COLUMN "parentTaskId" INTEGER;
ALTER TABLE "tasks" ADD COLUMN "order" INTEGER NOT NULL DEFAULT 0;

-- Add foreign key constraint for self-referential relationship
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_parentTaskId_fkey" FOREIGN KEY ("parentTaskId") REFERENCES "tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AlterTable: Make taskId required in comments (remove nullable)
-- First, delete any orphaned comments without taskId
DELETE FROM "comments" WHERE "taskId" IS NULL;

-- Then make taskId NOT NULL
ALTER TABLE "comments" ALTER COLUMN "taskId" SET NOT NULL;

-- Drop the old subtaskId column and foreign key
ALTER TABLE "comments" DROP CONSTRAINT IF EXISTS "comments_subtaskId_fkey";
ALTER TABLE "comments" DROP COLUMN IF EXISTS "subtaskId";

-- AlterTable: Make taskId required in attachments (remove nullable)
-- First, delete any orphaned attachments without taskId
DELETE FROM "attachments" WHERE "taskId" IS NULL;

-- Then make taskId NOT NULL
ALTER TABLE "attachments" ALTER COLUMN "taskId" SET NOT NULL;

-- Drop the old subtaskId column and foreign key
ALTER TABLE "attachments" DROP CONSTRAINT IF EXISTS "attachments_subtaskId_fkey";
ALTER TABLE "attachments" DROP COLUMN IF EXISTS "subtaskId";

-- AlterTable: Remove subtaskId from audit_logs
ALTER TABLE "audit_logs" DROP CONSTRAINT IF EXISTS "audit_logs_subtaskId_fkey";
ALTER TABLE "audit_logs" DROP COLUMN IF EXISTS "subtaskId";

-- DropTable: Drop the subtasks table
DROP TABLE IF EXISTS "subtasks";
