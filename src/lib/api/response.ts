import { NextResponse } from "next/server";
import { mapUnknownError } from "./errors";
import type { ApiErrorResponse, ApiFailureResponse, ApiSuccessResponse } from "./types";

export function ok<T>(data: T, init?: ResponseInit) {
  const payload: ApiSuccessResponse<T> = { ok: true, data };
  return NextResponse.json(payload, init);
}

export function fail(error: unknown, init?: ResponseInit) {
  const mapped = mapUnknownError(error);
  const payload: ApiFailureResponse = {
    ok: false,
    error: {
      code: mapped.code,
      message: mapped.message,
      ...(mapped.details === undefined ? {} : { details: mapped.details }),
    } satisfies ApiErrorResponse,
  };

  return NextResponse.json(payload, {
    ...init,
    status: init?.status ?? mapped.status,
  });
}
