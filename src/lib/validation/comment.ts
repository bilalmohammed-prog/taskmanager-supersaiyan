import { z } from "zod";
import { uuidSchema } from "./common";

const commentContentSchema = z
  .string()
  .trim()
  .min(1, "Comment content is required")
  .max(2000, "Comment content must be at most 2000 characters");

export const taskCommentsParamsSchema = z
  .object({
    taskId: uuidSchema,
  })
  .strict();

export const taskCommentParamsSchema = z
  .object({
    taskId: uuidSchema,
    commentId: uuidSchema,
  })
  .strict();

export const commentCreateSchema = z
  .object({
    content: commentContentSchema,
  })
  .strict();

export const commentUpdateSchema = z
  .object({
    content: commentContentSchema,
  })
  .strict();

export type CommentCreateInput = z.infer<typeof commentCreateSchema>;
export type CommentUpdateInput = z.infer<typeof commentUpdateSchema>;
