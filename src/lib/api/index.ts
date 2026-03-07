import { apiFetch } from './client';
import {
  DisplayTasksResponse,
  DisplayTasksResponseSchema,
  EmployeeOverviewResponse,
  EmployeeOverviewResponseSchema,
  EmployeeSwitchResponse,
  EmployeeSwitchResponseSchema,
  InviteActionRequest,
  InviteActionRequestSchema,
  InviteActionResponse,
  InviteActionResponseSchema,
  DropInviteRequest,
  DropInviteRequestSchema,
  DropInviteResponse,
  DropInviteResponseSchema,
  MessagesResponse,
  MessagesResponseSchema,
  SendMessageRequest,
  SendMessageRequestSchema,
  SendMessageResponse,
  SendMessageResponseSchema,
  CreateTaskRequest,
  CreateTaskRequestSchema,
  CreateTaskResponse,
  CreateTaskResponseSchema,
  UpdateTaskRequest,
  UpdateTaskRequestSchema,
  UpdateTaskResponse,
  UpdateTaskResponseSchema,
  DeleteTaskResponse,
  DeleteTaskResponseSchema,
  TeamProgressResponse,
  TeamProgressResponseSchema,
} from './types';

// GET /api/displayTasks
export async function getDisplayTasks(employeeId: string): Promise<DisplayTasksResponse> {
  const response = await apiFetch(`/api/displayTasks?employee_id=${encodeURIComponent(employeeId)}`);
  const data = await response.json();
  return DisplayTasksResponseSchema.parse(data);
}

// GET /api/employee-overview
export async function getEmployeeOverview(email: string): Promise<EmployeeOverviewResponse> {
  const response = await apiFetch(`/api/employee-overview?email=${encodeURIComponent(email)}`);
  const data = await response.json();
  return EmployeeOverviewResponseSchema.parse(data);
}

// GET /api/employee-switch
export async function getEmployeeSwitch(): Promise<EmployeeSwitchResponse> {
  const response = await apiFetch('/api/employee-switch');
  const data = await response.json();
  return EmployeeSwitchResponseSchema.parse(data);
}

// POST /api/invites/accept
export async function acceptInvite(request: InviteActionRequest): Promise<InviteActionResponse> {
  InviteActionRequestSchema.parse(request);
  const response = await apiFetch('/api/invites/accept', {
    method: 'POST',
    body: JSON.stringify(request),
  });
  const data = await response.json();
  return InviteActionResponseSchema.parse(data);
}

// POST /api/invites/decline
export async function declineInvite(request: InviteActionRequest): Promise<InviteActionResponse> {
  InviteActionRequestSchema.parse(request);
  const response = await apiFetch('/api/invites/decline', {
    method: 'POST',
    body: JSON.stringify(request),
  });
  const data = await response.json();
  return InviteActionResponseSchema.parse(data);
}

// POST /api/invites/drop
export async function dropInvite(request: DropInviteRequest): Promise<DropInviteResponse> {
  DropInviteRequestSchema.parse(request);
  const response = await apiFetch('/api/invites/drop', {
    method: 'POST',
    body: JSON.stringify(request),
  });
  const data = await response.json();
  return DropInviteResponseSchema.parse(data);
}

// GET /api/messages
export async function getMessages(): Promise<MessagesResponse> {
  const response = await apiFetch('/api/messages');
  const data = await response.json();
  return MessagesResponseSchema.parse(data);
}

// POST /api/messages/send
export async function sendMessage(request: SendMessageRequest): Promise<SendMessageResponse> {
  SendMessageRequestSchema.parse(request);
  const response = await apiFetch('/api/messages/send', {
    method: 'POST',
    body: JSON.stringify(request),
  });
  const data = await response.json();
  return SendMessageResponseSchema.parse(data);
}

// POST /api/tasks
export async function createTask(request: CreateTaskRequest): Promise<CreateTaskResponse> {
  CreateTaskRequestSchema.parse(request);
  const response = await apiFetch('/api/tasks', {
    method: 'POST',
    body: JSON.stringify(request),
  });
  const data = await response.json();
  return CreateTaskResponseSchema.parse(data);
}

// PATCH /api/tasks/[taskId]
export async function updateTask(taskId: string, request: UpdateTaskRequest): Promise<UpdateTaskResponse> {
  UpdateTaskRequestSchema.parse(request);
  const response = await apiFetch(`/api/tasks/${taskId}`, {
    method: 'PATCH',
    body: JSON.stringify(request),
  });
  const data = await response.json();
  return UpdateTaskResponseSchema.parse(data);
}

// DELETE /api/tasks/[taskId]
export async function deleteTask(taskId: string): Promise<DeleteTaskResponse> {
  const response = await apiFetch(`/api/tasks/${taskId}`, {
    method: 'DELETE',
  });
  const data = await response.json();
  return DeleteTaskResponseSchema.parse(data);
}

// GET /api/teamProgress
export async function getTeamProgress(): Promise<TeamProgressResponse> {
  const response = await apiFetch('/api/teamProgress');
  const data = await response.json();
  return TeamProgressResponseSchema.parse(data);
}