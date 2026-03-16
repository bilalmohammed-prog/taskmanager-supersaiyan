import { z } from "zod";
import { uuidSchema } from "./common";

export const createResourceAssignmentSchema = z
  .object({
    userId: uuidSchema,
    taskId: uuidSchema,
    allocatedHours: z.number().min(0).nullable().optional(),
  })
  .strict();

export const updateResourceAssignmentSchema = z
  .object({
    allocatedHours: z.number().min(0).nullable().optional(),
  })
  .strict();

export type CreateResourceAssignmentInput = z.infer<typeof createResourceAssignmentSchema>;
export type UpdateResourceAssignmentInput = z.infer<typeof updateResourceAssignmentSchema>;
