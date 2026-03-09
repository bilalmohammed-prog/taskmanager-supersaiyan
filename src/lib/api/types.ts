import { z } from 'zod';

// Task types
export const TaskSchema = z.object({
  id: z.string(),
  user_id: z.string(),
  title: z.string(),
  description: z.string().nullable(),
  status: z.string(),
  due_date: z.string().nullable(),
});

export type Task = z.infer<typeof TaskSchema>;

export const DisplayTasksResponseSchema = z.object({
  tasks: z.array(TaskSchema),
});

export type DisplayTasksResponse = z.infer<typeof DisplayTasksResponseSchema>;

// Employee overview
export const EmployeeOverviewResponseSchema = z.object({
  empID: z.string().nullable(),
  name: z.string().optional(),
});

export type EmployeeOverviewResponse = z.infer<typeof EmployeeOverviewResponseSchema>;

// Employee switch
export const EmployeeSchema = z.object({
  id: z.string(),
  name: z.string(),
  user_id: z.string(),
  emp_id: z.string(),
});

export type Employee = z.infer<typeof EmployeeSchema>;

export const EmployeeSwitchResponseSchema = z.object({
  employees: z.array(EmployeeSchema),
});

export type EmployeeSwitchResponse = z.infer<typeof EmployeeSwitchResponseSchema>;

// Invites
export const AcceptInviteRequestSchema = z.object({
  manager_id: z.string(),
});

export type AcceptInviteRequest = z.infer<typeof AcceptInviteRequestSchema>;

export const DropInviteRequestSchema = z.object({
  employee_id: z.string(),
  manager_id: z.string(),
});

export type DropInviteRequest = z.infer<typeof DropInviteRequestSchema>;

export const InviteActionResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
});

export type InviteActionResponse = z.infer<typeof InviteActionResponseSchema>;

export const DropInviteResponseSchema = z.object({
  success: z.boolean(),
});

export type DropInviteResponse = z.infer<typeof DropInviteResponseSchema>;

// Messages
export const MessageSchema = z.object({
  id: z.string(),
  sender_id: z.string(),
  receiver_id: z.string(),
  sender_email: z.string().nullable(),
  receiver_email: z.string(),
  subject: z.string(),
  body: z.string(),
  type: z.string(),
  status: z.string(),
  created_at: z.string(),
});

export type Message = z.infer<typeof MessageSchema>;

export const MessagesResponseSchema = z.array(MessageSchema);

export type MessagesResponse = z.infer<typeof MessagesResponseSchema>;

export const SendMessageRequestSchema = z.object({
  receiverEmail: z.string(),
  subject: z.string(),
  body: z.string(),
  type: z.string(),
});

export type SendMessageRequest = z.infer<typeof SendMessageRequestSchema>;

export const SendMessageResponseSchema = z.object({
  success: z.boolean(),
});

export type SendMessageResponse = z.infer<typeof SendMessageResponseSchema>;

// Tasks
export const CreateTaskRequestSchema = z.object({
  user_id: z.string(),
  organization_id: z.string(),
  title: z.string(),
  description: z.string().optional(),
  dueDate: z.string().optional(),
  status: z.string().optional(),
});

export type CreateTaskRequest = z.infer<typeof CreateTaskRequestSchema>;

export const CreateTaskResponseSchema = z.object({
  message: z.string(),
  task: TaskSchema,
});

export type CreateTaskResponse = z.infer<typeof CreateTaskResponseSchema>;

export const UpdateTaskRequestSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  dueDate: z.string().optional(),
  status: z
    .enum(['todo', 'in_progress', 'blocked', 'done', 'pending', 'in-progress', 'completed'])
    .optional(),
});

export type UpdateTaskRequest = z.infer<typeof UpdateTaskRequestSchema>;

export const UpdateTaskResponseSchema = z.object({
  task: TaskSchema,
});

export type UpdateTaskResponse = z.infer<typeof UpdateTaskResponseSchema>;

export const DeleteTaskResponseSchema = z.object({
  message: z.string(),
});

export type DeleteTaskResponse = z.infer<typeof DeleteTaskResponseSchema>;

// Team progress
export const TeamProgressItemSchema = z.object({
  user_id: z.string(),
  full_name: z.string(),
  total_tasks: z.number(),
  completed_tasks: z.number(),
  total_hours: z.number(),
});

export type TeamProgressItem = z.infer<typeof TeamProgressItemSchema>;

export const TeamProgressResponseSchema = z.object({
  employees: z.array(TeamProgressItemSchema),
});

export type TeamProgressResponse = z.infer<typeof TeamProgressResponseSchema>;

// API response contract
export const ApiErrorResponseSchema = z.object({
  code: z.string(),
  message: z.string(),
  details: z.unknown().optional(),
});

export type ApiErrorResponse = z.infer<typeof ApiErrorResponseSchema>;

export type ApiSuccessResponse<T> = {
  ok: true;
  data: T;
};

export type ApiFailureResponse = {
  ok: false;
  error: ApiErrorResponse;
};

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiFailureResponse;

// Error
export const ApiErrorSchema = z.object({
  error: z.string(),
});

export type ApiError = z.infer<typeof ApiErrorSchema>;

export class ApiException extends Error {
  constructor(message: string, public status?: number) {
    super(message);
    this.name = 'ApiException';
  }
}
