-- CreateIndex
CREATE INDEX "epics_projectId_idx" ON "public"."epics"("projectId");

-- CreateIndex
CREATE INDEX "epics_status_idx" ON "public"."epics"("status");

-- CreateIndex
CREATE INDEX "project_members_projectId_idx" ON "public"."project_members"("projectId");

-- CreateIndex
CREATE INDEX "project_members_userId_idx" ON "public"."project_members"("userId");

-- CreateIndex
CREATE INDEX "projects_organizationId_idx" ON "public"."projects"("organizationId");

-- CreateIndex
CREATE INDEX "projects_spaceId_idx" ON "public"."projects"("spaceId");

-- CreateIndex
CREATE INDEX "sprints_projectId_idx" ON "public"."sprints"("projectId");

-- CreateIndex
CREATE INDEX "sprints_status_idx" ON "public"."sprints"("status");

-- CreateIndex
CREATE INDEX "tasks_projectId_idx" ON "public"."tasks"("projectId");

-- CreateIndex
CREATE INDEX "tasks_projectId_parentTaskId_idx" ON "public"."tasks"("projectId", "parentTaskId");

-- CreateIndex
CREATE INDEX "tasks_sprintId_idx" ON "public"."tasks"("sprintId");

-- CreateIndex
CREATE INDEX "tasks_epicId_idx" ON "public"."tasks"("epicId");

-- CreateIndex
CREATE INDEX "tasks_assigneeId_idx" ON "public"."tasks"("assigneeId");

-- CreateIndex
CREATE INDEX "tasks_status_idx" ON "public"."tasks"("status");

-- CreateIndex
CREATE INDEX "tasks_priority_idx" ON "public"."tasks"("priority");
