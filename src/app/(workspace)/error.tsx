'use client';

import { useEffect } from 'react';
import { ErrorState } from '@/components/feedback/error-state';

/** Route-segment error boundary: the shell stays usable, only content fails. */
export default function WorkspaceError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);
  return <ErrorState title="This page failed to load" description={error.digest ? `Error reference ${error.digest}` : error.message} onRetry={reset} />;
}
