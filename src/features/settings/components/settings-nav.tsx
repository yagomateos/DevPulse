'use client';

import { Bell, Bot, Plug, Settings2, Shield, User } from 'lucide-react';
import { NavTabs } from '@/components/shared/nav-tabs';

const SECTIONS = [
  { label: 'General', href: '/settings/general', icon: Settings2 },
  { label: 'Account', href: '/settings/account', icon: User },
  { label: 'Notifications', href: '/settings/notifications', icon: Bell },
  { label: 'Security', href: '/settings/security', icon: Shield },
  { label: 'Integrations', href: '/settings/integrations', icon: Plug },
  { label: 'AI', href: '/settings/ai', icon: Bot },
];

export function SettingsNav() {
  return <NavTabs tabs={SECTIONS} label="Settings sections" />;
}
