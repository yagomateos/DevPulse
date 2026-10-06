import Link from 'next/link';
import { FolderX } from 'lucide-react';
import { EmptyState } from '@/components/feedback/empty-state';
import { Button } from '@/components/ui/button';

export default function ProjectNotFound() {
  return (
    <EmptyState
      icon={FolderX}
      title="Project not found"
      description="It may have been archived or you may not have access."
      action={
        <Button asChild size="sm" variant="outline">
          <Link href="/projects">All projects</Link>
        </Button>
      }
    />
  );
}
