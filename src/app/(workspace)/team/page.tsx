import type { Metadata } from 'next';
import { PageHeader } from '@/components/shared/page-header';
import { TeamTable } from '@/features/team/components/team-table';
import { queryKeys } from '@/lib/query-keys';
import { Hydrate } from '@/server/hydrate';
import { getRepository } from '@/server/repositories';

export const metadata: Metadata = { title: 'Team' };

export default async function TeamPage() {
  const members = await (await getRepository()).team.list();
  return (
    <div className="space-y-6">
      <PageHeader title="Team" description={`${members.filter((m) => m.status === 'active').length} active members · ${members.filter((m) => m.status === 'invited').length} pending invitations`} />
      <Hydrate queries={[[queryKeys.team.all, members]]}>
        <TeamTable />
      </Hydrate>
    </div>
  );
}
