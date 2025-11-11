-- CreateEnum
CREATE TYPE "public"."TemplateCategory" AS ENUM ('DESARROLLO_SOFTWARE', 'MARKETING', 'DISENO', 'VENTAS', 'OPERACIONES', 'RECURSOS_HUMANOS', 'GENERAL', 'PERSONALIZADO');

-- CreateTable
CREATE TABLE "public"."project_templates" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" "public"."TemplateCategory" NOT NULL DEFAULT 'GENERAL',
    "icon" TEXT DEFAULT 'Folder',
    "color" TEXT DEFAULT '#6B7280',
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "organizationId" INTEGER,
    "createdById" INTEGER,

    CONSTRAINT "project_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."template_states" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT NOT NULL DEFAULT '#9CA3AF',
    "order" INTEGER NOT NULL DEFAULT 0,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "templateId" INTEGER NOT NULL,

    CONSTRAINT "template_states_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."sprint_metrics" (
    "id" SERIAL NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "plannedTasks" INTEGER NOT NULL DEFAULT 0,
    "completedTasks" INTEGER NOT NULL DEFAULT 0,
    "remainingTasks" INTEGER NOT NULL DEFAULT 0,
    "idealRemaining" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sprintId" INTEGER NOT NULL,

    CONSTRAINT "sprint_metrics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."member_productivity" (
    "id" SERIAL NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tasksCompleted" INTEGER NOT NULL DEFAULT 0,
    "tasksInProgress" INTEGER NOT NULL DEFAULT 0,
    "tasksPending" INTEGER NOT NULL DEFAULT 0,
    "productivityScore" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" INTEGER NOT NULL,
    "projectId" INTEGER,

    CONSTRAINT "member_productivity_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "sprint_metrics_sprintId_date_key" ON "public"."sprint_metrics"("sprintId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "member_productivity_userId_projectId_date_key" ON "public"."member_productivity"("userId", "projectId", "date");

-- AddForeignKey
ALTER TABLE "public"."project_templates" ADD CONSTRAINT "project_templates_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."project_templates" ADD CONSTRAINT "project_templates_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."template_states" ADD CONSTRAINT "template_states_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "public"."project_templates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."sprint_metrics" ADD CONSTRAINT "sprint_metrics_sprintId_fkey" FOREIGN KEY ("sprintId") REFERENCES "public"."sprints"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."member_productivity" ADD CONSTRAINT "member_productivity_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."member_productivity" ADD CONSTRAINT "member_productivity_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "public"."projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
