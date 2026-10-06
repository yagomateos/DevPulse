'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { toast } from 'sonner';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FormFooter } from '@/components/shared/form-footer';
import { usePermissions } from '@/features/auth/hooks/use-permissions';
import { applyServerErrors } from '@/lib/forms';
import { ROLE_DESCRIPTIONS } from '@/lib/permissions';
import { inviteMemberSchema, type InviteMemberInput } from '@/schemas/team';
import { ROLES } from '@/types/domain';
import { useInviteMember } from '../hooks/use-team';

export function InviteMemberForm({ onDone }: { onDone: () => void }) {
  const { role: myRole } = usePermissions();
  const [formError, setFormError] = useState<string | null>(null);
  const invite = useInviteMember();
  const form = useForm<InviteMemberInput>({
    resolver: zodResolver(inviteMemberSchema),
    defaultValues: { name: '', email: '', role: 'DEVELOPER' },
  });
  const role = useWatch({ control: form.control, name: 'role' });

  const onSubmit = (values: InviteMemberInput) => {
    setFormError(null);
    invite.mutate(values, {
      onSuccess: (member) => {
        toast.success('Invitation sent', { description: `${member.name} will join as ${member.role.toLowerCase()}.` });
        onDone();
      },
      onError: (error) => setFormError(applyServerErrors(form, error)),
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Name</FormLabel>
                <FormControl>
                  <Input autoFocus {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Work email</FormLabel>
                <FormControl>
                  <Input type="email" placeholder="name@acme.dev" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <FormField
          control={form.control}
          name="role"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Role</FormLabel>
              <Select value={field.value} onValueChange={field.onChange}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {ROLES.map((r) => (
                    <SelectItem key={r} value={r} disabled={r === 'ADMIN' && myRole !== 'ADMIN'}>
                      {r.charAt(0) + r.slice(1).toLowerCase()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormDescription>{ROLE_DESCRIPTIONS[role]}</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormFooter error={formError} isSubmitting={invite.isPending} submitLabel="Send invitation" onCancel={onDone} />
      </form>
    </Form>
  );
}
