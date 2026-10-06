'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { useAIStatus } from '@/features/ai/hooks/use-ai-analysis';
import { usePermissions } from '@/features/auth/hooks/use-permissions';
import { aiSettingsSchema, type AISettings } from '@/schemas/settings';
import { useUpdateSettings } from '../hooks/use-settings';
import { SettingsFormActions } from './settings-form-actions';
import { SettingsSection } from './settings-section';
import { SwitchField } from './switch-field';

export function AISettingsForm({ defaults }: { defaults: AISettings }) {
  const { can } = usePermissions();
  const readOnly = !can('settings:ai');
  const status = useAIStatus();
  const update = useUpdateSettings('ai');
  const form = useForm<AISettings>({ resolver: zodResolver(aiSettingsSchema), defaultValues: defaults });
  const onSubmit = (v: AISettings) =>
    update.mutate(v, {
      onSuccess: () => {
        form.reset(v);
        toast.success('AI settings saved');
      },
      onError: (e) => toast.error(e.message),
    });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <SettingsSection
          title="AI"
          description={status.data?.live ? `Connected to an OpenAI-compatible endpoint (${status.data.model}).` : 'No AI_API_KEY configured — analyses use the deterministic demo model. These settings apply as soon as a key is set.'}
          footer={!readOnly && <SettingsFormActions isDirty={form.formState.isDirty} isSaving={update.isPending} isSaved={update.isSuccess} onReset={() => form.reset()} />}
        >
          <fieldset disabled={readOnly} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="model"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Model</FormLabel>
                    <FormControl>
                      <Input className="font-mono text-[13px]" {...field} />
                    </FormControl>
                    <FormDescription>Overridden by the AI_MODEL environment variable.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="temperature"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Temperature</FormLabel>
                    <FormControl>
                      <Input type="number" step={0.1} min={0} max={1} value={field.value} onChange={(e) => field.onChange(e.target.value === '' ? Number.NaN : Number(e.target.value))} />
                    </FormControl>
                    <FormDescription>0 = deterministic, 1 = creative.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="responseStyle"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Response style</FormLabel>
                  <FormControl>
                    <RadioGroup value={field.value} onValueChange={field.onChange} className="flex gap-4">
                      {(['concise', 'detailed'] as const).map((s) => (
                        <div key={s} className="flex items-center gap-2">
                          <RadioGroupItem value={s} id={`style-${s}`} />
                          <Label htmlFor={`style-${s}`} className="capitalize">
                            {s}
                          </Label>
                        </div>
                      ))}
                    </RadioGroup>
                  </FormControl>
                </FormItem>
              )}
            />
            <SwitchField control={form.control} name="includeLogs" label="Include deployment logs in prompts" description="Improves root-cause analysis; logs may contain sensitive data." disabled={readOnly} />
            <SwitchField control={form.control} name="autoAnalyzePullRequests" label="Suggest AI review on new pull requests" disabled={readOnly} />
          </fieldset>
        </SettingsSection>
      </form>
    </Form>
  );
}
