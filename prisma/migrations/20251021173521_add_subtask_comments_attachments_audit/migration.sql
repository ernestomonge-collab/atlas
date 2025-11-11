-- AlterTable
ALTER TABLE "public"."attachments" ADD COLUMN     "subtaskId" INTEGER,
ALTER COLUMN "taskId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "public"."audit_logs" ADD COLUMN     "subtaskId" INTEGER,
ALTER COLUMN "taskId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "public"."comments" ADD COLUMN     "subtaskId" INTEGER,
ALTER COLUMN "taskId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "public"."comments" ADD CONSTRAINT "comments_subtaskId_fkey" FOREIGN KEY ("subtaskId") REFERENCES "public"."subtasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."attachments" ADD CONSTRAINT "attachments_subtaskId_fkey" FOREIGN KEY ("subtaskId") REFERENCES "public"."subtasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."audit_logs" ADD CONSTRAINT "audit_logs_subtaskId_fkey" FOREIGN KEY ("subtaskId") REFERENCES "public"."subtasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;
