import type { Database } from "@/lib/types/database";

export type DatabaseRole = Database["public"]["Enums"]["role_type"];
export type AppRole = "owner" | "admin" | "manager" | "member";

export type AuthorizationResource =
  | "organization"
  | "project"
  | "task"
  | "assignment"
  | "comment";

export type AuthorizationAction =
  | "read"
  | "manage_members"
  | "create"
  | "update"
  | "delete"
  | "assign";

export type Permission =
  | "organization:read"
  | "organization:manage_members"
  | "project:create"
  | "project:update"
  | "project:delete"
  | "task:read"
  | "task:create"
  | "task:update"
  | "task:delete"
  | "task:assign"
  | "assignment:read"
  | "assignment:update"
  | "comment:create"
  | "comment:update"
  | "comment:delete";

const ROLE_PERMISSION_MATRIX: Record<AppRole, readonly Permission[]> = {
  owner: [
    "organization:read",
    "organization:manage_members",
    "project:create",
    "project:update",
    "project:delete",
    "task:read",
    "task:create",
    "task:update",
    "task:delete",
    "task:assign",
    "assignment:read",
    "assignment:update",
    "comment:create",
    "comment:update",
    "comment:delete",
  ],
  admin: [
    "organization:read",
    "organization:manage_members",
    "project:create",
    "project:update",
    "project:delete",
    "task:read",
    "task:create",
    "task:update",
    "task:delete",
    "task:assign",
    "assignment:read",
    "assignment:update",
    "comment:create",
    "comment:update",
    "comment:delete",
  ],
  manager: [
    "organization:read",
    "project:create",
    "project:update",
    "task:create",
    "task:update",
    "task:assign",
    "assignment:update",
    "comment:create",
    "comment:delete",
  ],
  member: [
    "organization:read",
    "task:read",
    "assignment:read",
    "comment:create",
    "comment:update",
  ],
};

const VALID_PERMISSIONS: ReadonlySet<Permission> = new Set<Permission>([
  "organization:read",
  "organization:manage_members",
  "project:create",
  "project:update",
  "project:delete",
  "task:read",
  "task:create",
  "task:update",
  "task:delete",
  "task:assign",
  "assignment:read",
  "assignment:update",
  "comment:create",
  "comment:update",
  "comment:delete",
]);

export function normalizeRole(role: DatabaseRole | AppRole): AppRole {
  if (role === "owner" || role === "admin" || role === "manager") {
    return role;
  }
  return "member";
}

export function toPermission(
  action: AuthorizationAction,
  resource: AuthorizationResource
): Permission | null {
  const permission = `${resource}:${action}` as Permission;
  if (!VALID_PERMISSIONS.has(permission)) {
    return null;
  }
  return permission;
}

export function getRolePermissions(role: DatabaseRole | AppRole): readonly Permission[] {
  return ROLE_PERMISSION_MATRIX[normalizeRole(role)];
}

export function hasPermission(
  role: DatabaseRole | AppRole,
  permission: Permission
): boolean {
  return getRolePermissions(role).includes(permission);
}

export function can(
  role: DatabaseRole | AppRole,
  action: AuthorizationAction,
  resource: AuthorizationResource
): boolean {
  const permission = toPermission(action, resource);
  if (!permission) {
    return false;
  }
  return hasPermission(role, permission);
}
