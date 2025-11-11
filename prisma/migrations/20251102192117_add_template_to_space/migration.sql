-- AlterTable
ALTER TABLE "public"."spaces" ADD COLUMN     "templateId" INTEGER;

-- AddForeignKey
ALTER TABLE "public"."spaces" ADD CONSTRAINT "spaces_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "public"."project_templates"("id") ON DELETE SET NULL ON UPDATE CASCADE;
