import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ProjectHeader } from '@/features/projects/components/project-header';
import { queryKeys } from '@/lib/query-keys';
import { Hydrate } from '@/server/hydrate';
import { getProject } from '@/server/queries';

type Props = { params: Promise<{ projectId: string }>; children: React.ReactNode };

export async function generateMetadata({ params }: Omit<Props, 'children'>): Promise<Metadata> {
  const project = await getProject((await params).projectId);
  return { title: project?.name ?? 'Project not found', description: project?.description };
}

/**
 * Nested layout: the project header and tabs persist while tab content
 * changes. No loading boundary sits above it, so a missing project is a real 404.
 */
export default async function ProjectLayout({ params, children }: Props) {
  const { projectId } = await params;
  const project = await getProject(projectId);
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
