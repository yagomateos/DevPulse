'use client';

import type { Control, FieldPath, FieldValues } from 'react-hook-form';
import { FormControl, FormDescription, FormField, FormItem, FormLabel } from '@/components/ui/form';
import { Switch } from '@/components/ui/switch';

export function SwitchField<T extends FieldValues>({ control, name, label, description, disabled }: { control: Control<T>; name: FieldPath<T>; label: string; description?: string; disabled?: boolean }) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem className="flex items-center justify-between gap-4 space-y-0 rounded-md border px-3 py-2.5">
          <div className="space-y-0.5">
            <FormLabel className="text-[13px]">{label}</FormLabel>
            {description && <FormDescription>{description}</FormDescription>}
          </div>
          <FormControl>
            <Switch checked={!!field.value} onCheckedChange={field.onChange} disabled={disabled} />
          </FormControl>
        </FormItem>
      )}
    />
  );
}
