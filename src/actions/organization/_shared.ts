
export type ActionError = { message: string };
export type ActionResult<T> = { data: T; error: null } | { data: null; error: ActionError };

export function safeErrorMessage(err: unknown): string {
  return err instanceof Error ? err.message : "Unexpected error";
}
