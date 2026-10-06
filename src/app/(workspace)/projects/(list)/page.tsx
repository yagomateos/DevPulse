import type { Metadata } from 'next';
import { PageHeader } from '@/components/shared/page-header';
import { ProjectsView } from '@/features/projects/components/projects-view';
import { queryKeys } from '@/lib/query-keys';
import { Hydrate } from '@/server/hydrate';
import { getRepository } from '@/server/repositories';

export const metadata: Metadata = { title: 'Projects' };

export default async function ProjectsPage() {
  const projects = await (await getRepository()).projects.list();
  return (
    <div className="space-y-6">
      <PageHeader title="Projects" description={`${projects.length} repositories connected to this workspace.`} />
      <Hydrate queries={[[queryKeys.projects.list(), projects]]}>
        <ProjectsView />
      </Hydrate>
    </div>
  );
}
