-- AlterTable
ALTER TABLE "public"."projects" ALTER COLUMN "organizationId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "public"."spaces" ALTER COLUMN "organizationId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "public"."users" ALTER COLUMN "organizationId" DROP NOT NULL;
