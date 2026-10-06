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

interface IntegrationConfig {
  key: keyof IntegrationsSettings;
  name: string;
  description: string;
  icon: LucideIcon;
  /** `live` talks to the real service; `mock` records its effect in-app (no credentials needed). */
  mode: 'live' | 'mock';
  field?: { name: 'slack.channel' | 'pagerduty.serviceKey'; label: string; placeholder: string };
}

const INTEGRATIONS: IntegrationConfig[] = [
  { key: 'github', name: 'GitHub', mode: 'live', description: "Syncs each project's pull requests from its repository (signed webhooks + daily reconcile). When disconnected, sync pauses and PR pages show a stale-data notice.", icon: Github },
  { key: 'slack', name: 'Slack', mode: 'mock', description: 'New incidents are posted to the channel (recorded on the incident timeline).', icon: MessageSquare, field: { name: 'slack.channel', label: 'Channel', placeholder: '#incidents' } },
  { key: 'pagerduty', name: 'PagerDuty', mode: 'mock', description: 'Pages on-call when a SEV1/SEV2 is declared (recorded on the timeline).', icon: Siren, field: { name: 'pagerduty.serviceKey', label: 'Service key', placeholder: 'PXXXXXX' } },
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
          description="GitHub is a live integration. Slack and PagerDuty are mock connectors: nothing leaves the app and no credentials are needed, but their effect is real and visible on the incident timeline."
          footer={!readOnly && <SettingsFormActions isDirty={form.formState.isDirty} isSaving={update.isPending} isSaved={update.isSuccess} onReset={() => form.reset()} />}
        >
          <ul className="space-y-3">
            {INTEGRATIONS.map((i) => {
              const connected = values[i.key]?.connected;
              const extra = i.field;
              return (
                <li key={i.key} className="space-y-3 rounded-lg border p-3">
                  <div className="flex items-center gap-3">
                    <span className="flex size-8 items-center justify-center rounded-md border bg-muted/40">
                      <i.icon className="size-4" aria-hidden />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="flex items-center gap-2 text-sm font-medium">
                        {i.name} {connected ? <Badge variant="success">Connected</Badge> : <Badge variant="muted">Not connected</Badge>}
                        {i.mode === 'mock' && <Badge variant="outline">Mock</Badge>}
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
                  {connected && extra && (
                    <FormField
                      control={form.control}
                      name={extra.name}
                      render={({ field }) => (
                        <FormItem className="max-w-xs">
                          <FormLabel className="text-xs">{extra.label}</FormLabel>
                          <FormControl>
                            <Input placeholder={extra.placeholder} disabled={readOnly} {...field} />
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
