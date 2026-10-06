import type { ReactNode } from 'react';
import { AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface FormFooterProps {
  error?: string | null;
  isSubmitting: boolean;
  submitLabel: string;
  onCancel?: () => void;
  extra?: ReactNode;
}

/** Consistent submit row: form-level error, cancel, loading submit. */
export function FormFooter({ error, isSubmitting, submitLabel, onCancel, extra }: FormFooterProps) {
  return (
    <div className="space-y-3 pt-2">
      {error && (
        <p role="alert" className="flex items-center gap-2 rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-destructive">
          <AlertCircle className="size-3.5 shrink-0" aria-hidden /> {error}
        </p>
      )}
      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        {extra}
        {onCancel && (
          <Button type="button" variant="ghost" onClick={onCancel} disabled={isSubmitting}>
            Cancel
          </Button>
        )}
        <Button type="submit" loading={isSubmitting}>
          {submitLabel}
        </Button>
      </div>
    </div>
  );
}
