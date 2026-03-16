import { z } from "zod";
import { isoDateStringSchema, uuidSchema } from "./common";

const nullableIsoDateStringSchema = isoDateStringSchema.nullable();
const hasValidAssignmentTimeRange = (payload: {
  start_time?: string | null;
  end_time?: string | null;
}) => {
  if (!payload.start_time || !payload.end_time) return true;
  return new Date(payload.start_time) <= new Date(payload.end_time);
};

const assignmentCreateBaseSchema = z
  .object({
    task_id: uuidSchema,
    user_id: uuidSchema,
    organization_id: uuidSchema,
    allocated_hours: z.number().min(0).nullable().optional(),
    start_time: nullableIsoDateStringSchema.optional(),
    end_time: nullableIsoDateStringSchema.optional(),
  })
  .strict();

export const assignmentCreateSchema = assignmentCreateBaseSchema.refine(hasValidAssignmentTimeRange, {
  message: "start_time must be before or equal to end_time",
  path: ["end_time"],
});

export const assignmentCreateBodySchema = assignmentCreateBaseSchema
  .omit({ organization_id: true })
  .strict()
  .refine(hasValidAssignmentTimeRange, {
    message: "start_time must be before or equal to end_time",
    path: ["end_time"],
  });

export const assignmentUpdateSchema = z
  .object({
    task_id: uuidSchema.optional(),
    user_id: uuidSchema.optional(),
    allocated_hours: z.number().min(0).nullable().optional(),
    start_time: nullableIsoDateStringSchema.optional(),
    end_time: nullableIsoDateStringSchema.optional(),
  })
  .strict()
  .refine((payload) => Object.keys(payload).length > 0, {
    message: "At least one field is required",
  })
  .refine(
    (payload) => {
      if (!payload.start_time || !payload.end_time) return true;
      return new Date(payload.start_time) <= new Date(payload.end_time);
    },
    {
      message: "start_time must be before or equal to end_time",
      path: ["end_time"],
    }
  );

export const assignmentIdParamsSchema = z
  .object({
    assignmentId: uuidSchema,
  })
  .strict();

export const assignmentListQuerySchema = z
  .object({
    taskId: uuidSchema.optional(),
    userId: uuidSchema.optional(),
    active: z
      .enum(["true", "false"])
      .transform((value) => value === "true")
      .optional(),
  })
  .strict();

export type AssignmentCreateInput = z.infer<typeof assignmentCreateSchema>;
export type AssignmentCreateBodyInput = z.infer<typeof assignmentCreateBodySchema>;
export type AssignmentUpdateInput = z.infer<typeof assignmentUpdateSchema>;
export type AssignmentListQueryInput = z.infer<typeof assignmentListQuerySchema>;
