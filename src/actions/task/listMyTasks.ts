"use server";

import { requireOrgContext } from "@/actions/_helpers/requireOrgContext";
import { uuidSchema } from "@/lib/validation/common";
import {
  listMyTasks as listMyTasksService,
  type MyTaskListItem,
} from "@/services/task/myTasks.service";

export async function listMyTasks(orgId: string): Promise<MyTaskListItem[]> {
  const actionStart = Date.now();
  const validatedOrgId = uuidSchema.parse(orgId);

  const contextStart = Date.now();
  const ctx = await requireOrgContext({ organizationId: validatedOrgId });
  console.info(`[perf] action listMyTasks context ${Date.now() - contextStart}ms`);

  const queryStart = Date.now();
  const result = await listMyTasksService(ctx.supabase, {
    organizationId: ctx.organizationId,
    userId: ctx.userId,
  });
  console.info(`[perf] action listMyTasks query ${Date.now() - queryStart}ms`);
  console.info(`[perf] action listMyTasks total ${Date.now() - actionStart}ms`);
  return result;
}
