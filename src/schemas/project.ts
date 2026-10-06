import { z } from 'zod';
import { PROJECT_STATUSES } from '@/types/domain';

const repositoryPattern = /^[a-z0-9-_.]+\/[a-z0-9-_.]+$/i;

export const createProjectSchema = z.object({
  name: z.string().trim().min(3, 'Name must be at least 3 characters').max(48, 'Keep it under 48 characters'),
  repository: z
    .string()
    .trim()
    .regex(repositoryPattern, 'Use the owner/repository format, e.g. acme/web'),
  defaultBranch: z.string().trim().min(1, 'Branch is required').max(64),
  description: z.string().trim().max(240, 'Keep the description under 240 characters').default(''),
  language: z.string().trim().min(1, 'Pick a language'),
});

export type CreateProjectInput = z.input<typeof createProjectSchema>;

export const projectSettingsSchema = createProjectSchema.extend({
  status: z.enum(PROJECT_STATUSES),
  tags: z
    .array(z.string().trim().min(1).max(24))
    .max(6, 'Use at most 6 tags'),
});

export type ProjectSettingsInput = z.input<typeof projectSettingsSchema>;
