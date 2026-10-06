import Link from 'next/link';
import { SearchX } from 'lucide-react';
import { EmptyState } from '@/components/feedback/empty-state';
import { Button } from '@/components/ui/button';

export default function WorkspaceNotFound() {
  return (
    <EmptyState
      icon={SearchX}
      title="We couldn’t find that"
      description="It may have been deleted, or the link is wrong."
      action={
        <Button asChild size="sm" variant="outline">
          <Link href="/dashboard">Go to dashboard</Link>
        </Button>
      }
    />
  );
}
