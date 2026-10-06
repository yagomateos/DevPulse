'use client';

import { Check } from 'lucide-react';
import { Button } from '@/components/ui/button';

/** Save/reset row: disabled until dirty, loading while saving, success tick after. */
export function SettingsFormActions({ isDirty, isSaving, isSaved, onReset, disabled }: { isDirty: boolean; isSaving: boolean; isSaved: boolean; onReset: () => void; disabled?: boolean }) {
  return (
    <div className="flex items-center gap-2">
      {isSaved && !isDirty && (
        <span className="flex items-center gap-1 text-xs text-success" role="status">
          <Check className="size-3.5" aria-hidden /> Saved
        </span>
      )}
      <Button type="button" variant="ghost" size="sm" onClick={onReset} disabled={!isDirty || isSaving}>
        Reset
      </Button>
      <Button type="submit" size="sm" loading={isSaving} disabled={!isDirty || disabled}>
        Save changes
      </Button>
    </div>
  );
}
