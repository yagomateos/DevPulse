'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { PROJECT_STATUS } from '@/components/status/status-badges';
import { SettingsFormActions } from '@/features/settings/components/settings-form-actions';
import { SettingsSection } from '@/features/settings/components/settings-section';
import { applyServerErrors } from '@/lib/forms';
import { projectSettingsSchema, type ProjectSettingsInput } from '@/schemas/project';
import { PROJECT_STATUSES, type Project } from '@/types/domain';
import { useUpdateProject } from '../hooks/use-projects';
import { LANGUAGES } from './create-project-form';
import { TagInput } from './tag-input';

export function ProjectSettingsForm({ project }: { project: Project }) {
  const update = useUpdateProject(project.id);
  const [formError, setFormError] = useState<string | null>(null);
  const form = useForm<ProjectSettingsInput>({
    resolver: zodResolver(projectSettingsSchema),
    defaultValues: { name: project.name, repository: project.repository, defaultBranch: project.defaultBranch, description: project.description, language: project.language, status: project.status, tags: project.tags },
  });

  const onSubmit = (values: ProjectSettingsInput) => {
    setFormError(null);
    update.mutate(values, {
      onSuccess: () => {
        form.reset(values);
        toast.success('Project settings saved');
      },
      onError: (e) => {
        setFormError(applyServerErrors(form, e));
        toast.error('Changes were reverted');
      },
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="max-w-3xl">
        <SettingsSection
          title="Project settings"
          description="Changes apply instantly across the app (optimistic update) and roll back if the server rejects them."
          footer={
            <>
              {formError && <p className="mr-auto text-xs text-destructive" role="alert">{formError}</p>}
              <SettingsFormActions isDirty={form.formState.isDirty} isSaving={update.isPending} isSaved={update.isSuccess} onReset={() => form.reset()} />
            </>
          }
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField control={form.control} name="name" render={({ field }) => (<FormItem><FormLabel>Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
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
                      {PROJECT_STATUSES.map((s) => (
                        <SelectItem key={s} value={s}>
                          {PROJECT_STATUS[s].label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField control={form.control} name="repository" render={({ field }) => (<FormItem><FormLabel>Repository</FormLabel><FormControl><Input className="font-mono text-[13px]" {...field} /></FormControl><FormMessage /></FormItem>)} />
            <FormField control={form.control} name="defaultBranch" render={({ field }) => (<FormItem><FormLabel>Default branch</FormLabel><FormControl><Input className="font-mono text-[13px]" {...field} /></FormControl><FormMessage /></FormItem>)} />
            <FormField
              control={form.control}
              name="language"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Language</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {LANGUAGES.map((l) => (
                        <SelectItem key={l} value={l}>
                          {l}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="tags"
              render={({ field, fieldState }) => (
                <FormItem>
                  <FormLabel>Tags</FormLabel>
                  <FormControl>
                    <TagInput value={field.value} onChange={field.onChange} invalid={!!fieldState.error} />
                  </FormControl>
                  <FormDescription>Press Enter to add.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <FormField control={form.control} name="description" render={({ field }) => (<FormItem><FormLabel>Description</FormLabel><FormControl><Textarea rows={3} {...field} /></FormControl><FormMessage /></FormItem>)} />
        </SettingsSection>
      </form>
    </Form>
  );
}
