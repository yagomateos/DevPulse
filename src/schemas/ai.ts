import { z } from 'zod';
import { RISK_LEVELS } from '@/types/domain';

/**
 * Structured AI outputs. The same schemas are:
 *  - converted to JSON Schema and sent as `response_format` to the LLM,
 *  - used to validate the model output on the server,
 *  - used to type the React components that render the result.
 */

export const FINDING_CATEGORIES = [
  'Security',
  'Performance',
  'Accessibility',
  'Type Safety',
  'Testing',
  'Maintainability',
] as const;
export type FindingCategory = (typeof FINDING_CATEGORIES)[number];

export const prFindingSchema = z.object({
  id: z.string(),
  category: z.enum(FINDING_CATEGORIES),
  severity: z.enum(RISK_LEVELS),
  title: z.string(),
  description: z.string(),
  file: z.string().nullable(),
  line: z.number().int().nullable(),
  suggestion: z.string().nullable(),
});

export const recommendationSchema = z.object({
  id: z.string(),
  priority: z.enum(['high', 'medium', 'low']),
  action: z.string(),
  rationale: z.string(),
});

export const prAnalysisSchema = z.object({
  riskScore: z.number().int().min(0).max(100),
  riskLevel: z.enum(RISK_LEVELS),
  summary: z.string(),
  findings: z.array(prFindingSchema),
  recommendations: z.array(recommendationSchema),
});

export const deploymentAnalysisSchema = z.object({
  risk: z.enum(RISK_LEVELS),
  possibleCause: z.string(),
  evidence: z.array(z.object({ id: z.string(), label: z.string(), detail: z.string(), source: z.enum(['logs', 'metrics', 'tests', 'changes']) })),
  affectedAreas: z.array(z.string()),
  recommendedActions: z.array(recommendationSchema),
  confidence: z.number().min(0).max(1),
});

export const incidentAnalysisSchema = z.object({
  summary: z.string(),
  likelyCause: z.string(),
  evidence: z.array(z.object({ id: z.string(), label: z.string(), detail: z.string(), href: z.string().nullable() })),
  affectedServices: z.array(z.string()),
  recommendations: z.array(recommendationSchema),
  confidence: z.number().min(0).max(1),
});

export type PRFinding = z.infer<typeof prFindingSchema>;
export type Recommendation = z.infer<typeof recommendationSchema>;
export type PRAnalysis = z.infer<typeof prAnalysisSchema>;
export type DeploymentAnalysis = z.infer<typeof deploymentAnalysisSchema>;
export type IncidentAnalysis = z.infer<typeof incidentAnalysisSchema>;

export const AI_ANALYSIS_KINDS = ['pull_request', 'deployment', 'incident'] as const;
export type AIAnalysisKind = (typeof AI_ANALYSIS_KINDS)[number];

export interface AIAnalysisResultMap {
  pull_request: PRAnalysis;
  deployment: DeploymentAnalysis;
  incident: IncidentAnalysis;
}

export interface AIAnalysisEnvelope<K extends AIAnalysisKind> {
  id: string;
  kind: K;
  targetId: string;
  model: string;
  createdAt: string;
  result: AIAnalysisResultMap[K];
}

/* ---------------------------------- Chat ---------------------------------- */

export const aiContextSchema = z.object({
  type: z.enum(['workspace', 'project', 'pull_request', 'deployment', 'incident']),
  id: z.string().nullable(),
  label: z.string(),
});

export type AIContext = z.infer<typeof aiContextSchema>;

export const chatRequestSchema = z.object({
  messages: z
    .array(z.object({ role: z.enum(['user', 'assistant']), content: z.string().max(8000) }))
    .min(1)
    .max(40),
  context: aiContextSchema,
});

export type ChatRequest = z.infer<typeof chatRequestSchema>;

export interface SourceRef {
  type: 'project' | 'pull_request' | 'deployment' | 'incident';
  id: string;
  label: string;
  href: string;
}

/** Newline-delimited JSON events streamed by `/api/ai/chat`. */
export type ChatStreamEvent =
  | { type: 'status'; message: string }
  | { type: 'text'; delta: string }
  | { type: 'sources'; sources: SourceRef[] }
  | { type: 'done'; model: string }
  | { type: 'error'; message: string };
