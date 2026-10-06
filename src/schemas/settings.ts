import { z } from 'zod';
import { isValidTimeZone } from '@/lib/timezones';

export const generalSettingsSchema = z.object({
  workspaceName: z.string().trim().min(2, 'Workspace name is required').max(48),
  timezone: z.string().min(1).refine(isValidTimeZone, 'Unknown time zone'),
  defaultLanding: z.enum(['dashboard', 'projects', 'ai']),
  network: z.object({
    latency: z.enum(['instant', 'realistic', 'slow']),
    failureRate: z.enum(['0', '0.1', '0.3']),
  }),
});

export const accountSettingsSchema = z.object({
  name: z.string().trim().min(2, 'Name is required').max(64),
  email: z.email('Enter a valid email'),
  title: z.string().trim().max(64),
});

/** Which events reach the in-app notification inbox (applied server-side). */
export const notificationSettingsSchema = z.object({
  inApp: z.object({
    incidents: z.boolean(),
    deployments: z.boolean(),
    reviews: z.boolean(),
    mentions: z.boolean(),
  }),
  minimumSeverity: z.enum(['sev1', 'sev2', 'sev3', 'sev4']),
});

export const securitySettingsSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z
      .string()
      .min(10, 'Use at least 10 characters')
      .regex(/[A-Z]/, 'Include an uppercase letter')
      .regex(/[0-9]/, 'Include a number'),
    confirmPassword: z.string(),
  })
  .refine((v) => v.newPassword === v.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Passwords do not match',
  });

export const integrationsSettingsSchema = z.object({
  github: z.object({ connected: z.boolean(), organization: z.string().trim().max(64) }),
  slack: z.object({ connected: z.boolean(), channel: z.string().trim().max(64) }),
  pagerduty: z.object({ connected: z.boolean(), serviceKey: z.string().trim().max(64) }),
});

export const aiSettingsSchema = z.object({
  model: z.string().trim().min(1, 'Model is required'),
  temperature: z.number().min(0, 'Minimum is 0').max(1, 'Maximum is 1'),
  responseStyle: z.enum(['concise', 'detailed']),
  includeLogs: z.boolean(),
  autoAnalyzePullRequests: z.boolean(),
});

export type GeneralSettings = z.infer<typeof generalSettingsSchema>;
export type AccountSettings = z.infer<typeof accountSettingsSchema>;
export type NotificationSettings = z.infer<typeof notificationSettingsSchema>;
export type SecuritySettingsInput = z.infer<typeof securitySettingsSchema>;
export type IntegrationsSettings = z.infer<typeof integrationsSettingsSchema>;
export type AISettings = z.infer<typeof aiSettingsSchema>;

export interface WorkspaceSettings {
  general: GeneralSettings;
  notifications: NotificationSettings;
  integrations: IntegrationsSettings;
  ai: AISettings;
}

export const SETTINGS_SECTIONS = ['general', 'account', 'notifications', 'security', 'integrations', 'ai'] as const;
export type SettingsSection = (typeof SETTINGS_SECTIONS)[number];
