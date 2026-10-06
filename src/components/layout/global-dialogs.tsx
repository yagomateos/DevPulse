'use client';

import dynamic from 'next/dynamic';
import { ResponsiveDialog } from '@/components/shared/responsive-dialog';
import { LoadingSkeleton } from '@/components/feedback/loading-skeleton';
import { useDialogStore } from '@/stores/dialog-store';

// Forms are only downloaded when a dialog is first opened.
const loading = () => <LoadingSkeleton variant="list" rows={4} />;
const CreateIncidentForm = dynamic(() => import('@/features/incidents/components/create-incident-form').then((m) => m.CreateIncidentForm), { loading });
const CreateProjectForm = dynamic(() => import('@/features/projects/components/create-project-form').then((m) => m.CreateProjectForm), { loading });
const InviteMemberForm = dynamic(() => import('@/features/team/components/invite-member-form').then((m) => m.InviteMemberForm), { loading });

export function GlobalDialogs() {
  const { active, payload, closeDialog } = useDialogStore();
  const onOpenChange = (open: boolean) => !open && closeDialog();
  return (
    <>
      <ResponsiveDialog open={active === 'create-incident'} onOpenChange={onOpenChange} title="Declare an incident" description="Responders are notified and a timeline starts immediately." className="sm:max-w-xl">
        {active === 'create-incident' && <CreateIncidentForm defaultProjectId={payload.projectId} onDone={closeDialog} />}
      </ResponsiveDialog>
      <ResponsiveDialog open={active === 'create-project'} onOpenChange={onOpenChange} title="Create project" description="Connect a repository to start tracking PRs, deployments and incidents.">
        {active === 'create-project' && <CreateProjectForm onDone={closeDialog} />}
      </ResponsiveDialog>
      <ResponsiveDialog open={active === 'invite-member'} onOpenChange={onOpenChange} title="Invite a teammate" description="We’ll email them a single-use link to set a password and join. It expires in 7 days.">
        {active === 'invite-member' && <InviteMemberForm onDone={closeDialog} />}
      </ResponsiveDialog>
    </>
  );
}
