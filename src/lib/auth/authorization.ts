import { ForbiddenError } from "@/lib/api/errors";
import type {
  AppRole,
  AuthorizationAction,
  AuthorizationResource,
  DatabaseRole,
} from "./permissions";
import { can, normalizeRole } from "./permissions";

export type AuthorizationContext = {
  role: DatabaseRole | AppRole;
};

export function isAuthorized(
  action: AuthorizationAction,
  resource: AuthorizationResource,
  context: AuthorizationContext
): boolean {
  return can(context.role, action, resource);
}

export function authorize(
  action: AuthorizationAction,
  resource: AuthorizationResource,
  context: AuthorizationContext
): void {
  if (!isAuthorized(action, resource, context)) {
    throw new ForbiddenError({
      message: `Role '${normalizeRole(context.role)}' cannot ${action} ${resource}`,
    });
  }
}
