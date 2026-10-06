'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { FormFooter } from '@/components/shared/form-footer';
import { applyServerErrors } from '@/lib/forms';
import { createProjectSchema, type CreateProjectInput } from '@/schemas/project';
import { useCreateProject } from '../hooks/use-projects';

export const LANGUAGES = ['TypeScript', 'JavaScript', 'Go', 'Python', 'Rust', 'Java', 'MDX'];

export function CreateProjectForm({ onDone }: { onDone: () => void }) {
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);
  const create = useCreateProject();
  const form = useForm<CreateProjectInput>({
    resolver: zodResolver(createProjectSchema),
    defaultValues: { name: '', repository: '', defaultBranch: 'main', description: '', language: 'TypeScript' },
  });

  const onSubmit = (values: CreateProjectInput) => {
    setFormError(null);
    create.mutate(values, {
      onSuccess: (project) => {
        toast.success('Project created', { description: project.name });
        onDone();
        router.push(`/projects/${project.id}`);
      },
      onError: (error) => setFormError(applyServerErrors(form, error)),
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Project name</FormLabel>
              <FormControl>
                <Input placeholder="Billing Service" autoFocus {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid gap-4 sm:grid-cols-[1fr_140px]">
          <FormField
            control={form.control}
            name="repository"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Repository</FormLabel>
                <FormControl>
                  <Input placeholder="acme/billing" className="font-mono text-[13px]" {...field} />
                </FormControl>
                <FormDescription>owner/name on your Git provider</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="defaultBranch"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Branch</FormLabel>
                <FormControl>
                  <Input className="font-mono text-[13px]" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <FormField
          control={form.control}
          name="language"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Primary language</FormLabel>
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
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea rows={2} placeholder="What does this project do?" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormFooter error={formError} isSubmitting={create.isPending} submitLabel="Create project" onCancel={onDone} />
      </form>
    </Form>
  );
}
