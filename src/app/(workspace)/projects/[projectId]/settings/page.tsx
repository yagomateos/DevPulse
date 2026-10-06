import { notFound } from 'next/navigation';
import { ErrorState } from '@/components/feedback/error-state';
import { ProjectSettingsForm } from '@/features/projects/components/project-settings-form';
import { can } from '@/lib/permissions';
import { getSession } from '@/server/auth/session';
import { getRepository } from '@/server/repositories';

export default async function ProjectSettingsPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  const session = await getSession();
  // Server-side RBAC: the tab is hidden for developers, and direct URL access is refused here too.
  if (!can(session?.user.role, 'project:update')) {
    return <ErrorState title="You don’t have access" description="Only admins and managers can change project settings." />;
  }
  const project = await (await getRepository()).projects.get(projectId);
  if (!project) notFound();
  return <ProjectSettingsForm project={project} />;
}
