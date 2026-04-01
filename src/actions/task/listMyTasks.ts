"use server";

import { requireOrgContext } from "@/actions/_helpers/requireOrgContext";
import { uuidSchema } from "@/lib/validation/common";
import {
  listMyTasks as listMyTasksService,
  type MyTaskListItem,
} from "@/services/task/myTasks.service";

export async function listMyTasks(orgId: string): Promise<MyTaskListItem[]> {
  const validatedOrgId = uuidSchema.parse(orgId);

  const ctx = await requireOrgContext({ organizationId: validatedOrgId });

  return listMyTasksService(ctx.supabase, {
    organizationId: ctx.organizationId,
    userId: ctx.userId,
  });
}
