'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { usePermissions } from '@/features/auth/hooks/use-permissions';
import { applyServerErrors } from '@/lib/forms';
import { generalSettingsSchema, type GeneralSettings } from '@/schemas/settings';
import { useUpdateSettings } from '../hooks/use-settings';
import { SettingsFormActions } from './settings-form-actions';
import { SettingsSection } from './settings-section';

const TIMEZONES = ['UTC', 'Europe/Madrid', 'Europe/London', 'America/New_York', 'America/Los_Angeles', 'Asia/Tokyo'];

export function GeneralSettingsForm({ defaults }: { defaults: GeneralSettings }) {
  const { can } = usePermissions();
  const readOnly = !can('settings:workspace');
  const update = useUpdateSettings('general');
  const router = useRouter();
  const form = useForm<GeneralSettings>({ resolver: zodResolver(generalSettingsSchema), defaultValues: defaults });

  const onSubmit = (values: GeneralSettings) =>
    update.mutate(values, {
      onSuccess: () => {
        form.reset(values);
        toast.success('Workspace settings saved');
        // Time zone is applied by the server layout; refresh to re-render with it.
        router.refresh();
      },
      onError: (e) => toast.error(applyServerErrors(form, e)),
    });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <fieldset disabled={readOnly} className="space-y-6">
          {readOnly && <p className="rounded-md border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">Only admins can change workspace settings. You are viewing them read-only.</p>}
          <SettingsSection title="Workspace" description="Name and defaults shared by everyone in the workspace.">
            <FormField
              control={form.control}
              name="workspaceName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Workspace name</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="timezone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Timezone</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange} disabled={readOnly}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {TIMEZONES.map((tz) => (
                          <SelectItem key={tz} value={tz}>
                            {tz}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="defaultLanding"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Default landing page</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange} disabled={readOnly}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="dashboard">Dashboard</SelectItem>
                        <SelectItem value="projects">Projects</SelectItem>
                        <SelectItem value="ai">AI Assistant</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />
            </div>
          </SettingsSection>
          <SettingsSection title="Demo network conditions" description="The mock API can simulate latency and failures so you can see loading, error and retry states across the app.">
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="network.latency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Latency</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange} disabled={readOnly}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="instant">Instant</SelectItem>
                        <SelectItem value="realistic">Realistic (200–650 ms)</SelectItem>
                        <SelectItem value="slow">Slow (1.2–2.4 s)</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="network.failureRate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Random failures (GET)</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange} disabled={readOnly}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="0">None</SelectItem>
                        <SelectItem value="0.1">10% of requests</SelectItem>
                        <SelectItem value="0.3">30% of requests</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>Failed queries retry automatically, then show a retry button.</FormDescription>
                  </FormItem>
                )}
              />
            </div>
          </SettingsSection>
        </fieldset>
        {!readOnly && (
          <div className="flex justify-end">
            <SettingsFormActions isDirty={form.formState.isDirty} isSaving={update.isPending} isSaved={update.isSuccess} onReset={() => form.reset()} />
          </div>
        )}
      </form>
    </Form>
  );
}
