import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { AccountSettingsForm } from '@/features/settings/components/account-settings-form';
import { AISettingsForm } from '@/features/settings/components/ai-settings-form';
import { GeneralSettingsForm } from '@/features/settings/components/general-settings-form';
import { IntegrationsSettingsForm } from '@/features/settings/components/integrations-settings-form';
import { NotificationSettingsForm } from '@/features/settings/components/notification-settings-form';
import { SecuritySettings } from '@/features/settings/components/security-settings';
import { SETTINGS_SECTIONS, type SettingsSection } from '@/schemas/settings';
import { getRepository } from '@/server/repositories';

type Props = { params: Promise<{ section: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { section } = await params;
  return { title: `${section.charAt(0).toUpperCase()}${section.slice(1)} settings` };
}

/** Server Component: loads current values, renders the matching client form. */
export default async function SettingsSectionPage({ params }: Props) {
  const { section } = await params;
  if (!SETTINGS_SECTIONS.includes(section as SettingsSection)) notFound();
  const settings = await (await getRepository()).settings.get();
  switch (section as SettingsSection) {
    case 'general':
      return <GeneralSettingsForm defaults={settings.general} />;
    case 'account':
      return <AccountSettingsForm />;
    case 'notifications':
      return <NotificationSettingsForm defaults={settings.notifications} />;
    case 'security':
      return <SecuritySettings />;
    case 'integrations':
      return <IntegrationsSettingsForm defaults={settings.integrations} />;
    case 'ai':
      return <AISettingsForm defaults={settings.ai} />;
  }
}
