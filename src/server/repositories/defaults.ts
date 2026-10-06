import type { WorkspaceSettings } from '@/schemas/settings';

export const DEFAULT_SETTINGS: WorkspaceSettings = {
  general: {
    workspaceName: 'Acme Engineering',
    timezone: 'Europe/Madrid',
    defaultLanding: 'dashboard',
    network: { latency: 'realistic', failureRate: '0' },
  },
  notifications: {
    inApp: { incidents: true, deployments: true, reviews: true, mentions: true },
    minimumSeverity: 'sev3',
  },
  integrations: {
    github: { connected: true },
    slack: { connected: false, channel: '#incidents' },
    pagerduty: { connected: false, serviceKey: '' },
  },
  ai: {
    model: 'gpt-4.1-mini',
    temperature: 0.2,
    responseStyle: 'concise',
    includeLogs: true,
    autoAnalyzePullRequests: false,
  },
};
