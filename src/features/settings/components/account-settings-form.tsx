'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useForm, useWatch } from 'react-hook-form';
import { toast } from 'sonner';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { UserAvatar } from '@/components/shared/user-avatar';
import { useSession } from '@/features/auth/components/session-provider';
import { applyServerErrors } from '@/lib/forms';
import { accountSettingsSchema, type AccountSettings } from '@/schemas/settings';
import { useUpdateAccount } from '../hooks/use-settings';
import { SettingsFormActions } from './settings-form-actions';
import { SettingsSection } from './settings-section';

export function AccountSettingsForm() {
  const { user } = useSession();
  const router = useRouter();
  const update = useUpdateAccount();
  const form = useForm<AccountSettings>({ resolver: zodResolver(accountSettingsSchema), defaultValues: { name: user.name, email: user.email, title: user.title } });
  const name = useWatch({ control: form.control, name: 'name' });

  const onSubmit = (values: AccountSettings) =>
    update.mutate(values, {
      onSuccess: () => {
        form.reset(values);
        toast.success('Profile updated');
        router.refresh(); // the session user is resolved on the server
      },
      onError: (e) => toast.error(applyServerErrors(form, e)),
    });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <SettingsSection
          title="Profile"
          description="How you appear to teammates across the workspace."
          footer={<SettingsFormActions isDirty={form.formState.isDirty} isSaving={update.isPending} isSaved={update.isSuccess} onReset={() => form.reset()} />}
        >
          <div className="flex items-center gap-3">
            <UserAvatar name={name || user.name} size="lg" />
            <p className="text-xs text-muted-foreground">Avatars are generated from your initials.</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full name</FormLabel>
                  <FormControl>
                    <Input autoComplete="name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Job title</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input type="email" autoComplete="email" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </SettingsSection>
      </form>
    </Form>
  );
}
