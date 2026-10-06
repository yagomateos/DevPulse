'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { toast } from 'sonner';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Combobox } from '@/components/ui/combobox';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { FormFooter } from '@/components/shared/form-footer';
import { UserAvatar } from '@/components/shared/user-avatar';
import { SEVERITY } from '@/components/status/status-badges';
import { useProjects } from '@/features/projects/hooks/use-projects';
import { useTeam } from '@/features/team/hooks/use-team';
import { applyServerErrors } from '@/lib/forms';
import { cn } from '@/lib/utils';
import { createIncidentSchema, type CreateIncidentInput } from '@/schemas/incident';
import { deploymentQueries } from '@/services/deployments';
import { INCIDENT_SEVERITIES } from '@/types/domain';
import { useCreateIncident, useIncidentFacets } from '../hooks/use-incidents';

const NONE = '__none__';

export function CreateIncidentForm({ defaultProjectId, onDone }: { defaultProjectId?: string | null; onDone: () => void }) {
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);
  const createIncident = useCreateIncident();
  const form = useForm<CreateIncidentInput>({
    resolver: zodResolver(createIncidentSchema),
    defaultValues: { projectId: defaultProjectId ?? '', title: '', description: '', severity: 'sev3', service: '', assignee: null, relatedDeploymentId: null },
  });

  // Dependent fields: service options and deployments follow the chosen project.
  const projectId = useWatch({ control: form.control, name: 'projectId' });
  const projects = useProjects();
  const team = useTeam();
  const facets = useIncidentFacets(projectId || undefined);
  const deployments = useQuery({ ...deploymentQueries.list({ projectId, pageSize: 8 }), enabled: !!projectId });

  const onSubmit = (values: CreateIncidentInput) => {
    setFormError(null);
    createIncident.mutate(values, {
      onSuccess: (incident) => {
        toast.success(`${incident.reference} declared`, { description: incident.title });
        onDone();
        router.push(`/projects/${incident.projectId}/incidents/${incident.id}`);
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
            name="projectId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Project</FormLabel>
                <Select
                  value={field.value}
                  onValueChange={(v) => {
                    field.onChange(v);
                    form.setValue('service', '');
                    form.setValue('relatedDeploymentId', null);
                  }}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder={projects.isPending ? 'Loading…' : 'Select project'} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {projects.data?.filter((p) => p.status !== 'archived').map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="service"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Affected service</FormLabel>
                <Select value={field.value} onValueChange={field.onChange} disabled={!projectId}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder={projectId ? 'Select service' : 'Pick a project first'} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {facets.data?.services.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Title</FormLabel>
              <FormControl>
                <Input placeholder="e.g. Checkout requests timing out" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="severity"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Severity</FormLabel>
              <FormControl>
                <RadioGroup value={field.value} onValueChange={field.onChange} className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {INCIDENT_SEVERITIES.map((sev) => (
                    <label
                      key={sev}
                      className={cn(
                        'flex cursor-pointer flex-col rounded-md border px-2.5 py-2 text-xs transition-colors hover:bg-accent has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring',
                        field.value === sev && 'border-primary bg-primary/10',
                      )}
                    >
                      <RadioGroupItem value={sev} className="sr-only" />
                      <span className="font-mono font-semibold">{SEVERITY[sev].label}</span>
                      <span className="text-muted-foreground">{SEVERITY[sev].description.split(' — ')[0]}</span>
                    </label>
                  ))}
                </RadioGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>What’s happening?</FormLabel>
              <FormControl>
                <Textarea rows={3} placeholder="Symptoms, impact, first observations…" {...field} />
              </FormControl>
              <FormDescription>{field.value.length}/2000</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="assignee"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Incident commander</FormLabel>
                <FormControl>
                  <Combobox
                    options={(team.data ?? []).filter((m) => m.status === 'active').map((m) => ({ value: m.name, label: m.name, description: m.title, keywords: [m.email], icon: <UserAvatar name={m.name} size="xs" /> }))}
                    value={field.value}
                    onChange={field.onChange}
                    placeholder="Unassigned"
                    searchPlaceholder="Search people…"
                    clearLabel="Unassigned"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="relatedDeploymentId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Suspected deployment</FormLabel>
                <Select value={field.value ?? NONE} onValueChange={(v) => field.onChange(v === NONE ? null : v)} disabled={!projectId}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value={NONE}>None</SelectItem>
                    {deployments.data?.items.map((d) => (
                      <SelectItem key={d.id} value={d.id}>
                        #{d.number} · {d.environment} · {d.status}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <FormFooter error={formError} isSubmitting={createIncident.isPending} submitLabel="Declare incident" onCancel={onDone} />
      </form>
    </Form>
  );
}
