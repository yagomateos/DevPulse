'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SEVERITY } from '@/components/status/status-badges';
import { queryKeys } from '@/lib/query-keys';
import { notificationSettingsSchema, type NotificationSettings } from '@/schemas/settings';
import { INCIDENT_SEVERITIES } from '@/types/domain';
import { useUpdateSettings } from '../hooks/use-settings';
import { SettingsFormActions } from './settings-form-actions';
import { SettingsSection } from './settings-section';
import { SwitchField } from './switch-field';

export function NotificationSettingsForm({ defaults }: { defaults: NotificationSettings }) {
  const queryClient = useQueryClient();
  const update = useUpdateSettings('notifications');
  const form = useForm<NotificationSettings>({ resolver: zodResolver(notificationSettingsSchema), defaultValues: defaults });
  const onSubmit = (values: NotificationSettings) =>
    update.mutate(values, {
      onSuccess: () => {
        form.reset(values);
        // The inbox is filtered server-side with these preferences.
        void queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });
        toast.success('Notification preferences saved');
      },
      onError: (e) => toast.error(e.message),
    });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <SettingsSection
          title="Notifications"
          description="Choose which events reach your notification inbox (the bell in the top bar). Email delivery is not part of this demo."
          footer={<SettingsFormActions isDirty={form.formState.isDirty} isSaving={update.isPending} isSaved={update.isSuccess} onReset={() => form.reset()} />}
        >
          <fieldset className="space-y-2">
            <legend className="mb-2 text-xs font-medium text-muted-foreground">Inbox</legend>
            <SwitchField control={form.control} name="inApp.incidents" label="Incidents" description="New incidents at or above the severity below" />
            <SwitchField control={form.control} name="inApp.deployments" label="Deployments" description="Failed or rolled-back deployments" />
            <SwitchField control={form.control} name="inApp.reviews" label="Review requests" />
            <SwitchField control={form.control} name="inApp.mentions" label="Mentions" />
          </fieldset>
          <FormField
            control={form.control}
            name="minimumSeverity"
            render={({ field }) => (
              <FormItem className="max-w-sm">
                <FormLabel>Minimum incident severity</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {INCIDENT_SEVERITIES.map((s) => (
                      <SelectItem key={s} value={s}>
                        {SEVERITY[s].label} — {SEVERITY[s].description.split(' — ')[1]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormDescription>Lower-severity incidents still appear in the Incidents list.</FormDescription>
              </FormItem>
            )}
          />
        </SettingsSection>
      </form>
    </Form>
  );
}
