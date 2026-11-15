import "server-only";
import { z } from "zod";

import type { ActionError, ErrorCode, FieldErrors } from "@/lib/result";

/**
 * The only error type that crosses layer boundaries. Database errors are
 * translated into AppError so the rest of the app never sees vendor errors.
 */
export class AppError extends Error {
  constructor(
    public readonly code: ErrorCode,
    message: string,
    public readonly options: { fieldErrors?: FieldErrors; cause?: unknown } = {},
  ) {
    super(message, { cause: options.cause });
    this.name = "AppError";
  }

  static validation(message = "Invalid input", fieldErrors?: FieldErrors) {
    return new AppError("VALIDATION", message, { fieldErrors });
  }
  static unauthenticated(message = "You must be signed in") {
    return new AppError("UNAUTHENTICATED", message);
  }
  static forbidden(message = "You do not have permission to do this") {
    return new AppError("FORBIDDEN", message);
  }
  static notFound(message = "Not found") {
    return new AppError("NOT_FOUND", message);
  }
  static conflict(message = "This conflicts with existing data") {
    return new AppError("CONFLICT", message);
  }
  static internal(message = "Something went wrong", cause?: unknown) {
    return new AppError("INTERNAL", message, { cause });
  }
}

type PostgrestLikeError = { code?: string; message: string };

/** Translate PostgREST / Postgres errors into AppError. */
export function fromDbError(error: PostgrestLikeError): AppError {
  switch (error.code) {
    case "PGRST116":
      return AppError.notFound();
    case "23505":
      return AppError.conflict("A record with these details already exists");
    case "23503":
      return AppError.conflict("This record is referenced by other data");
    case "23502":
    case "23514":
    case "22P02":
      return AppError.validation(error.message);
    default:
      return AppError.internal("Database request failed", error);
  }
}

export function fieldErrorsFromZod(error: z.ZodError): FieldErrors {
  const out: FieldErrors = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "_root";
    (out[key] ??= []).push(issue.message);
  }
  return out;
}

/** Convert anything thrown into a client-safe ActionError (no internals leak). */
export function toActionError(error: unknown): ActionError {
  if (error instanceof AppError) {
    return {
      code: error.code,
      message: error.code === "INTERNAL" ? "Something went wrong" : error.message,
      fieldErrors: error.options.fieldErrors,
    };
  }
  if (error instanceof z.ZodError) {
    return { code: "VALIDATION", message: "Invalid input", fieldErrors: fieldErrorsFromZod(error) };
  }
  return { code: "INTERNAL", message: "Something went wrong" };
}
