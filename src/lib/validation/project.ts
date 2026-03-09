import { z } from "zod";
import { isoDateStringSchema, nonEmptyStringSchema, uuidSchema } from "./common";

export const projectStatusSchema = z.enum(["active", "paused", "archived"]);

export const projectCreateSchema = z
  .object({
    name: nonEmptyStringSchema,
    status: projectStatusSchema.optional(),
    startDate: isoDateStringSchema.nullable().optional(),
    endDate: isoDateStringSchema.nullable().optional(),
  })
  .strict()
  .refine(
    (payload) => {
      if (!payload.startDate || !payload.endDate) return true;
      return new Date(payload.startDate) <= new Date(payload.endDate);
    },
    {
      message: "startDate must be before or equal to endDate",
      path: ["endDate"],
    }
  );

export const projectUpdateSchema = z
  .object({
    name: nonEmptyStringSchema.optional(),
    status: projectStatusSchema.optional(),
    startDate: isoDateStringSchema.nullable().optional(),
    endDate: isoDateStringSchema.nullable().optional(),
  })
  .strict()
  .refine((payload) => Object.keys(payload).length > 0, {
    message: "At least one field is required",
  })
  .refine(
    (payload) => {
      if (!payload.startDate || !payload.endDate) return true;
      return new Date(payload.startDate) <= new Date(payload.endDate);
    },
    {
      message: "startDate must be before or equal to endDate",
      path: ["endDate"],
    }
  );

export const projectIdParamsSchema = z
  .object({
    projectId: uuidSchema,
  })
  .strict();

export const projectListQuerySchema = z
  .object({
    page: z.coerce.number().int().min(1).default(1),
    size: z.coerce.number().int().min(1).max(100).default(20),
  })
  .strict();

export const projectMemberCreateSchema = z
  .object({
    userId: uuidSchema,
    role: nonEmptyStringSchema.optional(),
  })
  .strict();

export const projectMemberRoleUpdateSchema = z
  .object({
    role: nonEmptyStringSchema,
  })
  .strict();

export const projectMemberParamsSchema = z
  .object({
    projectId: uuidSchema,
    userId: uuidSchema,
  })
  .strict();

export type ProjectCreateInput = z.infer<typeof projectCreateSchema>;
export type ProjectUpdateInput = z.infer<typeof projectUpdateSchema>;
export type ProjectListQueryInput = z.infer<typeof projectListQuerySchema>;
