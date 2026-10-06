'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { INCIDENT_STATUS } from '@/components/status/status-badges';
import { PermissionGate } from '@/features/auth/components/permission-gate';
import { updateIncidentSchema, type UpdateIncidentInput } from '@/schemas/incident';
import { INCIDENT_STATUSES, type Incident } from '@/types/domain';
import { useUpdateIncident } from '../hooks/use-incidents';

/** Status update + timeline note. Applied optimistically; rolls back on failure. */
export function IncidentStatusControl({ incident }: { incident: Incident }) {
  const update = useUpdateIncident(incident.id);
  // `values` must be referentially stable: RHF resets the form whenever it changes.
  const values = useMemo<UpdateIncidentInput>(() => ({ status: incident.status, note: '' }), [incident.status]);
  const form = useForm<UpdateIncidentInput>({ resolver: zodResolver(updateIncidentSchema), values });

  const onSubmit = (values: UpdateIncidentInput) =>
    update.mutate(values, {
      onSuccess: () => {
        toast.success(values.status === incident.status ? 'Note added to timeline' : `Status changed to ${INCIDENT_STATUS[values.status].label}`);
        form.reset({ status: values.status, note: '' });
      },
      onError: (error) => toast.error('Update failed — changes were reverted', { description: error.message }),
    });

  return (
    <PermissionGate permission="incident:update" fallback={<p className="text-xs text-muted-foreground">Your role can’t update incidents.</p>}>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Status</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {INCIDENT_STATUSES.map((s) => (
                      <SelectItem key={s} value={s}>
                        {INCIDENT_STATUS[s].label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="note"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Timeline note</FormLabel>
                <FormControl>
                  <Textarea rows={2} placeholder="What changed?" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" size="sm" className="w-full" loading={update.isPending} disabled={!form.formState.isDirty}>
            Update incident
          </Button>
        </form>
      </Form>
    </PermissionGate>
  );
}
