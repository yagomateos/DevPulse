import { NextResponse } from 'next/server';
import type { z } from 'zod';
import type { Permission } from '@/lib/permissions';
import {
  aiSettingsSchema,
  generalSettingsSchema,
  integrationsSettingsSchema,
  notificationSettingsSchema,
  type WorkspaceSettings,
} from '@/schemas/settings';
import { requirePermission, requireSession } from '@/server/auth/session';
import { notFound, parseBody, route } from '@/server/http';
import { getRepository } from '@/server/repositories';

const SECTIONS: { [K in keyof WorkspaceSettings]: { schema: z.ZodType<WorkspaceSettings[K]>; permission: Permission | null } } = {
  general: { schema: generalSettingsSchema, permission: 'settings:workspace' },
  notifications: { schema: notificationSettingsSchema, permission: null },
  integrations: { schema: integrationsSettingsSchema, permission: 'settings:workspace' },
  ai: { schema: aiSettingsSchema, permission: 'settings:ai' },
};

export const PUT = route<{ params: Promise<{ section: string }> }>(async (request, { params }) => {
  const { section } = await params;
  if (!(section in SECTIONS)) notFound('Settings section');
  const key = section as keyof WorkspaceSettings;
  const config = SECTIONS[key];
  if (config.permission) await requirePermission(config.permission);
  else await requireSession();
  const value = await parseBody(request, config.schema);
  return NextResponse.json(await (await getRepository()).settings.update(key, value as never));
});
