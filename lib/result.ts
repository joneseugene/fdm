/**
 * Serializable result returned by every server action. Actions never throw
 * domain errors to the client; they return `{ ok: false, error }`.
 */

export const ERROR_CODES = [
  "VALIDATION",
  "UNAUTHENTICATED",
  "FORBIDDEN",
  "NOT_FOUND",
  "CONFLICT",
  "RATE_LIMITED",
  "INTEGRATION",
  "INTERNAL",
] as const;

export type ErrorCode = (typeof ERROR_CODES)[number];

export type FieldErrors = Record<string, string[]>;

export type ActionError = {
  code: ErrorCode;
  message: string;
  /** Per-field messages, keyed by form field name (dot paths for nesting). */
  fieldErrors?: FieldErrors;
};

export type ActionResult<T> = { ok: true; data: T } | { ok: false; error: ActionError };
