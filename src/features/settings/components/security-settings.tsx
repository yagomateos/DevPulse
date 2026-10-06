'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Clock, LogOut } from 'lucide-react';
import { useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { FormFooter } from '@/components/shared/form-footer';
import { expireSessionSoon, logout } from '@/features/auth/actions';
import { useSession } from '@/features/auth/components/session-provider';
import { applyServerErrors } from '@/lib/forms';
import { formatDateTime } from '@/lib/format';
import { securitySettingsSchema, type SecuritySettingsInput } from '@/schemas/settings';
import { useChangePassword } from '../hooks/use-settings';
import { SettingsSection } from './settings-section';

function PasswordForm() {
  const change = useChangePassword();
  const [formError, setFormError] = useState<string | null>(null);
  const form = useForm<SecuritySettingsInput>({ resolver: zodResolver(securitySettingsSchema), defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' } });
  const onSubmit = (values: SecuritySettingsInput) => {
    setFormError(null);
    change.mutate(values, {
      onSuccess: () => {
        form.reset();
        toast.success('Password changed', { description: 'Use your new password next time you sign in.' });
      },
      onError: (e) => setFormError(applyServerErrors(form, e)),
    });
  };
  const fields = [
    { name: 'currentPassword', label: 'Current password', autoComplete: 'current-password' },
    { name: 'newPassword', label: 'New password', autoComplete: 'new-password', description: 'At least 10 characters, one uppercase letter and one number.' },
    { name: 'confirmPassword', label: 'Confirm new password', autoComplete: 'new-password' },
  ] as const;
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="max-w-md space-y-4" noValidate>
        {fields.map((f) => (
          <FormField
            key={f.name}
            control={form.control}
            name={f.name}
            render={({ field }) => (
              <FormItem>
                <FormLabel>{f.label}</FormLabel>
                <FormControl>
                  <Input type="password" autoComplete={f.autoComplete} {...field} />
                </FormControl>
                {'description' in f && <FormDescription>{f.description}</FormDescription>}
                <FormMessage />
              </FormItem>
            )}
          />
        ))}
        <FormFooter error={formError} isSubmitting={change.isPending} submitLabel="Update password" />
      </form>
    </Form>
  );
}

export function SecuritySettings() {
  const { expiresAt, setExpiresAt } = useSession();
  const [isPending, startTransition] = useTransition();
  return (
    <div className="space-y-6">
      <SettingsSection title="Password" description="Change the password used to sign in to this workspace.">
        <PasswordForm />
      </SettingsSection>
      <SettingsSection title="Session" description="Sessions are signed, http-only cookies that expire automatically.">
        <p className="flex items-center gap-2 text-sm">
          <Clock className="size-4 text-muted-foreground" aria-hidden />
          Current session expires at <span className="font-medium">{formatDateTime(new Date(expiresAt), 'PPp')}</span>
        </p>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            loading={isPending}
            onClick={() =>
              startTransition(async () => {
                const { expiresAt: next } = await expireSessionSoon(10);
                setExpiresAt(next);
                toast.info('Session will expire in 10 seconds', { description: 'Watch the app redirect you to sign in and bring you back here afterwards.' });
              })
            }
          >
            Simulate expiry in 10s
          </Button>
          <Button variant="ghost" size="sm" onClick={() => startTransition(() => logout())}>
            <LogOut /> Sign out
          </Button>
        </div>
      </SettingsSection>
    </div>
  );
}
