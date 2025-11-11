-- AlterTable
ALTER TABLE "public"."projects" ADD COLUMN     "templateId" INTEGER;

-- AddForeignKey
ALTER TABLE "public"."projects" ADD CONSTRAINT "projects_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "public"."project_templates"("id") ON DELETE SET NULL ON UPDATE CASCADE;
