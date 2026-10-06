'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { Form, FormControl, FormField, FormItem, FormLabel } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SEVERITY } from '@/components/status/status-badges';
import { notificationSettingsSchema, type NotificationSettings } from '@/schemas/settings';
import { INCIDENT_SEVERITIES } from '@/types/domain';
import { useUpdateSettings } from '../hooks/use-settings';
import { SettingsFormActions } from './settings-form-actions';
import { SettingsSection } from './settings-section';
import { SwitchField } from './switch-field';

export function NotificationSettingsForm({ defaults }: { defaults: NotificationSettings }) {
  const update = useUpdateSettings('notifications');
  const form = useForm<NotificationSettings>({ resolver: zodResolver(notificationSettingsSchema), defaultValues: defaults });
  const onSubmit = (values: NotificationSettings) =>
    update.mutate(values, {
      onSuccess: () => {
        form.reset(values);
        toast.success('Notification preferences saved');
      },
      onError: (e) => toast.error(e.message),
    });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <SettingsSection
          title="Notifications"
          description="Choose what reaches your inbox and what stays in the app."
          footer={<SettingsFormActions isDirty={form.formState.isDirty} isSaving={update.isPending} isSaved={update.isSuccess} onReset={() => form.reset()} />}
        >
          <fieldset className="space-y-2">
            <legend className="mb-2 text-xs font-medium text-muted-foreground">Email</legend>
            <SwitchField control={form.control} name="email.incidents" label="Incidents" description="New incidents and severity changes" />
            <SwitchField control={form.control} name="email.deployments" label="Failed deployments" description="Production deployments that fail or roll back" />
            <SwitchField control={form.control} name="email.reviews" label="Review requests" />
            <SwitchField control={form.control} name="email.weeklyDigest" label="Weekly digest" description="A Monday summary of delivery and reliability" />
          </fieldset>
          <fieldset className="space-y-2">
            <legend className="mb-2 text-xs font-medium text-muted-foreground">In app</legend>
            <SwitchField control={form.control} name="inApp.mentions" label="Mentions" />
            <SwitchField control={form.control} name="inApp.assignments" label="Assignments" />
          </fieldset>
          <FormField
            control={form.control}
            name="minimumSeverity"
            render={({ field }) => (
              <FormItem className="max-w-xs">
                <FormLabel>Notify me for incidents at or above</FormLabel>
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
              </FormItem>
            )}
          />
        </SettingsSection>
      </form>
    </Form>
  );
}
