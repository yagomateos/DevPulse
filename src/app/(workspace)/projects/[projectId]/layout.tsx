import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ProjectHeader } from '@/features/projects/components/project-header';
import { queryKeys } from '@/lib/query-keys';
import { Hydrate } from '@/server/hydrate';
import { getRepository } from '@/server/repositories';

type Props = { params: Promise<{ projectId: string }>; children: React.ReactNode };

export async function generateMetadata({ params }: Omit<Props, 'children'>): Promise<Metadata> {
  const project = await (await getRepository()).projects.get((await params).projectId);
  return { title: project?.name ?? 'Project not found', description: project?.description };
}

/** Nested layout: the project header and tabs persist while tab content changes. */
export default async function ProjectLayout({ params, children }: Props) {
  const { projectId } = await params;
  const project = await (await getRepository()).projects.get(projectId);
  if (!project) notFound();
  return (
    <div className="space-y-6">
      <Hydrate queries={[[queryKeys.projects.detail(projectId), project]]}>
        <ProjectHeader projectId={projectId} />
      </Hydrate>
      {children}
    </div>
  );
}
