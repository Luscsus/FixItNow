import type { ZodError } from "zod";

type FieldErrors<T extends string> = Partial<Record<T, string>>;

export function mapZodErrors<T extends string>(
  error: ZodError,
): FieldErrors<T> {
  const fieldErrors: FieldErrors<T> = {};

  for (const issue of error.issues) {
    const field = issue.path[0];
    if (typeof field === "string" && !fieldErrors[field as T]) {
      fieldErrors[field as T] = issue.message;
    }
  }

  return fieldErrors;
}
