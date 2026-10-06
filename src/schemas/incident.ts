import * as z from 'zod';
import { INCIDENT_SEVERITIES, INCIDENT_STATUSES } from '@/types/domain';

export const createIncidentSchema = z.object({
  projectId: z.string().min(1, 'Select a project'),
  title: z.string().trim().min(8, 'Describe the incident in at least 8 characters').max(120),
  description: z.string().trim().min(20, 'Add some context (20+ characters) for responders').max(2000),
  severity: z.enum(INCIDENT_SEVERITIES),
  service: z.string().trim().min(2, 'Service is required').max(48),
  assignee: z.string().nullable(),
  relatedDeploymentId: z.string().nullable(),
});

export type CreateIncidentInput = z.infer<typeof createIncidentSchema>;

export const updateIncidentSchema = z.object({
  status: z.enum(INCIDENT_STATUSES),
  note: z.string().trim().max(500).optional(),
});

export type UpdateIncidentInput = z.infer<typeof updateIncidentSchema>;
