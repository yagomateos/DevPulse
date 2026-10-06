import type { Metadata } from 'next';
import { PageHeader } from '@/components/shared/page-header';
import { Assistant } from '@/features/ai/components/assistant';

export const metadata: Metadata = { title: 'AI Assistant' };

export default function AIPage() {
  return (
    <div className="space-y-4">
      <PageHeader title="AI Assistant" description="Ask questions about your projects, pull requests, deployments and incidents." />
      <Assistant />
    </div>
  );
}
