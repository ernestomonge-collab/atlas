-- AlterTable: Change tasks.status from ENUM to TEXT, preserving existing data
ALTER TABLE "public"."tasks"
  ALTER COLUMN "status" TYPE TEXT USING "status"::TEXT;

ALTER TABLE "public"."tasks"
  ALTER COLUMN "status" SET DEFAULT 'PENDING';

-- AlterTable: Change subtasks.status from ENUM to TEXT, preserving existing data
ALTER TABLE "public"."subtasks"
  ALTER COLUMN "status" TYPE TEXT USING "status"::TEXT;

ALTER TABLE "public"."subtasks"
  ALTER COLUMN "status" SET DEFAULT 'PENDING';

-- Drop the TaskStatus enum type as it's no longer needed
DROP TYPE IF EXISTS "public"."TaskStatus";
