import { ZodError } from "zod";

type ErrorOptions = {
  message?: string;
  details?: unknown;
};

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details?: unknown;

  constructor(status: number, code: string, options: ErrorOptions = {}) {
    super(options.message ?? code);
    this.name = new.target.name;
    this.status = status;
    this.code = code;
    this.details = options.details;
  }
}

export class ValidationError extends ApiError {
  constructor(options: ErrorOptions = {}) {
    super(400, "VALIDATION_ERROR", {
      message: options.message ?? "Validation failed",
      details: options.details,
    });
  }
}

export class UnauthorizedError extends ApiError {
  constructor(options: ErrorOptions = {}) {
    super(401, "UNAUTHORIZED", {
      message: options.message ?? "Unauthorized",
      details: options.details,
    });
  }
}

export class ForbiddenError extends ApiError {
  constructor(options: ErrorOptions = {}) {
    super(403, "FORBIDDEN", {
      message: options.message ?? "Forbidden",
      details: options.details,
    });
  }
}

export class NotFoundError extends ApiError {
  constructor(options: ErrorOptions = {}) {
    super(404, "NOT_FOUND", {
      message: options.message ?? "Not found",
      details: options.details,
    });
  }
}

export class ConflictError extends ApiError {
  constructor(options: ErrorOptions = {}) {
    super(409, "CONFLICT", {
      message: options.message ?? "Conflict",
      details: options.details,
    });
  }
}

export class InternalServerError extends ApiError {
  constructor(options: ErrorOptions = {}) {
    super(500, "INTERNAL_SERVER_ERROR", {
      message: options.message ?? "Internal Server Error",
      details: options.details,
    });
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export function mapUnknownError(err: unknown): ApiError {
  if (err instanceof ApiError) {
    return err;
  }

  if (err instanceof ZodError) {
    return new ValidationError({
      message: "Request validation failed",
      details: err.flatten(),
    });
  }

  if (err instanceof SyntaxError) {
    return new ValidationError({ message: "Malformed JSON body" });
  }

  if (isRecord(err)) {
    const message = typeof err.message === "string" ? err.message : undefined;
    const code = typeof err.code === "string" ? err.code : undefined;

    if (code === "23505") {
      return new ConflictError({
        message: message ?? "Resource already exists",
        details: err,
      });
    }

    if (typeof err.status === "number" && typeof code === "string") {
      return new ApiError(err.status, code, {
        message: message ?? code,
        details: err,
      });
    }

    if (message) {
      return new InternalServerError({ message });
    }
  }

  if (err instanceof Error) {
    return new InternalServerError({ message: err.message });
  }

  return new InternalServerError();
}
