'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Github, MessageSquare, Siren, type LucideIcon } from 'lucide-react';
import { useForm, useWatch } from 'react-hook-form';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { usePermissions } from '@/features/auth/hooks/use-permissions';
import { integrationsSettingsSchema, type IntegrationsSettings } from '@/schemas/settings';
import { useUpdateSettings } from '../hooks/use-settings';
import { SettingsFormActions } from './settings-form-actions';
import { SettingsSection } from './settings-section';

const INTEGRATIONS: { key: keyof IntegrationsSettings; name: string; description: string; icon: LucideIcon; field: { name: 'organization' | 'channel' | 'serviceKey'; label: string; placeholder: string } }[] = [
  { key: 'github', name: 'GitHub', description: 'Sync pull requests, checks and commits.', icon: Github, field: { name: 'organization', label: 'Organization', placeholder: 'acme' } },
  { key: 'slack', name: 'Slack', description: 'Post incident updates to a channel.', icon: MessageSquare, field: { name: 'channel', label: 'Channel', placeholder: '#incidents' } },
  { key: 'pagerduty', name: 'PagerDuty', description: 'Page on-call when a SEV1/SEV2 is declared.', icon: Siren, field: { name: 'serviceKey', label: 'Service key', placeholder: 'PXXXXXX' } },
];

export function IntegrationsSettingsForm({ defaults }: { defaults: IntegrationsSettings }) {
  const { can } = usePermissions();
  const readOnly = !can('settings:workspace');
  const update = useUpdateSettings('integrations');
  const form = useForm<IntegrationsSettings>({ resolver: zodResolver(integrationsSettingsSchema), defaultValues: defaults });
  const values = useWatch({ control: form.control });
  const onSubmit = (v: IntegrationsSettings) =>
    update.mutate(v, {
      onSuccess: () => {
        form.reset(v);
        toast.success('Integrations updated');
      },
      onError: (e) => toast.error(e.message),
    });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <SettingsSection
          title="Integrations"
          description="Demo mode uses mock connectors, so no external credentials are required. Settings are stored and shared with the team."
          footer={!readOnly && <SettingsFormActions isDirty={form.formState.isDirty} isSaving={update.isPending} isSaved={update.isSuccess} onReset={() => form.reset()} />}
        >
          <ul className="space-y-3">
            {INTEGRATIONS.map((i) => {
              const connected = values[i.key]?.connected;
              return (
                <li key={i.key} className="space-y-3 rounded-lg border p-3">
                  <div className="flex items-center gap-3">
                    <span className="flex size-8 items-center justify-center rounded-md border bg-muted/40">
                      <i.icon className="size-4" aria-hidden />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="flex items-center gap-2 text-sm font-medium">
                        {i.name} {connected ? <Badge variant="success">Connected</Badge> : <Badge variant="muted">Not connected</Badge>}
                      </p>
                      <p className="text-xs text-muted-foreground">{i.description}</p>
                    </div>
                    <FormField
                      control={form.control}
                      name={`${i.key}.connected`}
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Switch checked={field.value} onCheckedChange={field.onChange} disabled={readOnly} aria-label={`Connect ${i.name}`} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                  {connected && (
                    <FormField
                      control={form.control}
                      name={`${i.key}.${i.field.name}` as `github.organization`}
                      render={({ field }) => (
                        <FormItem className="max-w-xs">
                          <FormLabel className="text-xs">{i.field.label}</FormLabel>
                          <FormControl>
                            <Input placeholder={i.field.placeholder} disabled={readOnly} {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </li>
              );
            })}
          </ul>
        </SettingsSection>
      </form>
    </Form>
  );
}
