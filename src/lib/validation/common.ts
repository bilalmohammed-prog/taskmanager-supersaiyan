import { z } from "zod";

export const uuidSchema = z.string().uuid("Must be a valid UUID");

export const nonEmptyStringSchema = z.string().trim().min(1, "Cannot be empty");

export const optionalTextSchema = z.string().trim();

export const isoDateStringSchema = z
  .string()
  .trim()
  .refine((value) => !Number.isNaN(Date.parse(value)), {
    message: "Must be a valid date string",
  });

export const taskStatusSchema = z.enum(["todo", "in_progress", "blocked", "done"]);

export const taskStatusInputSchema = z.enum([
  "todo",
  "in_progress",
  "blocked",
  "done",
  "pending",
  "in-progress",
  "completed",
]);

export function normalizeTaskStatusInput(
  status: z.infer<typeof taskStatusInputSchema>
): z.infer<typeof taskStatusSchema> {
  if (status === "pending") return "todo";
  if (status === "in-progress") return "in_progress";
  if (status === "completed") return "done";
  return status;
}

export function toLegacyTaskStatus(status: string | null): string {
  if (status === "todo") return "pending";
  if (status === "in_progress") return "in-progress";
  if (status === "done") return "completed";
  return status ?? "pending";
}
