import * as z from 'zod';
import {
  DATE_RANGES,
  DEPLOYMENT_STATUSES,
  ENVIRONMENTS,
  INCIDENT_SEVERITIES,
  INCIDENT_STATUSES,
  PR_STATUSES,
  RISK_LEVELS,
} from '@/types/domain';

/** Comma separated list in a query string → validated array. */
const csv = <T extends readonly [string, ...string[]]>(values: T) =>
  z
    .string()
    .optional()
    .transform((v) => (v ? v.split(',').filter(Boolean) : []))
    .pipe(z.array(z.enum(values)));

const sortParam = z
  .string()
  .regex(/^[a-zA-Z]+\.(asc|desc)$/)
  .optional();

const pageParams = {
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(10),
};

export const pullRequestQuerySchema = z.object({
  projectId: z.string().optional(),
  q: z.string().trim().max(100).optional(),
  status: csv(PR_STATUSES),
  risk: csv(RISK_LEVELS),
  sort: sortParam,
  ...pageParams,
});

export const deploymentQuerySchema = z.object({
  projectId: z.string().optional(),
  q: z.string().trim().max(100).optional(),
  status: csv(DEPLOYMENT_STATUSES),
  environment: csv(ENVIRONMENTS),
  sort: sortParam,
  ...pageParams,
});

export const incidentQuerySchema = z.object({
  projectId: z.string().optional(),
  q: z.string().trim().max(100).optional(),
  severity: csv(INCIDENT_SEVERITIES),
  status: csv(INCIDENT_STATUSES),
  service: z.string().optional().transform((v) => (v ? v.split(',').filter(Boolean) : [])),
  assignee: z.string().optional().transform((v) => (v ? v.split(',').filter(Boolean) : [])),
  sort: sortParam,
  ...pageParams,
});

export const dashboardQuerySchema = z.object({
  range: z.enum(DATE_RANGES).default('7d'),
  projectId: z.string().optional(),
  environment: z.enum(ENVIRONMENTS).optional(),
});

export type PullRequestQuery = z.infer<typeof pullRequestQuerySchema>;
export type DeploymentQuery = z.infer<typeof deploymentQuerySchema>;
export type IncidentQuery = z.infer<typeof incidentQuerySchema>;
export type DashboardQuery = z.infer<typeof dashboardQuerySchema>;
