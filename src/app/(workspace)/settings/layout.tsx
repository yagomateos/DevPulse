import { PageHeader } from '@/components/shared/page-header';
import { SettingsNav } from '@/features/settings/components/settings-nav';

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="space-y-6">
      <PageHeader title="Settings" description="Workspace, account and integration preferences." />
      <SettingsNav />
      <div className="max-w-3xl">{children}</div>
    </div>
  );
}
