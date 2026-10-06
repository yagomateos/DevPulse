import type { FieldValues, Path, UseFormReturn } from 'react-hook-form';
import { ApiError } from './http';

/**
 * Maps a 422 response's field issues onto React Hook Form so server-side
 * validation shows inline, exactly like client-side validation.
 * Returns the message to show at form level for anything not field-specific.
 */
export function applyServerErrors<T extends FieldValues>(form: UseFormReturn<T>, error: unknown): string {
  if (error instanceof ApiError && error.issues.length) {
    for (const issue of error.issues) {
      if (issue.path) form.setError(issue.path as Path<T>, { message: issue.message });
    }
    return 'Please fix the highlighted fields.';
  }
  return error instanceof Error ? error.message : 'Something went wrong.';
}
