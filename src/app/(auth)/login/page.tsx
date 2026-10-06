import type { Metadata } from 'next';
import { Clock } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Logo } from '@/components/layout/logo';
import { LoginForm } from '@/features/auth/components/login-form';
import { isDemoMode } from '@/server/config';

export const metadata: Metadata = { title: 'Sign in' };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string; reason?: string }> }) {
  const { next, reason } = await searchParams;
  const demoMode = isDemoMode();
  return (
    <main id="main" className="grid min-h-dvh lg:grid-cols-2">
      <section className="flex flex-col justify-center px-6 py-12 sm:px-12">
        <div className="mx-auto w-full max-w-sm space-y-6">
          <Logo />
          <div className="space-y-1">
            <h1 className="text-xl font-semibold tracking-tight">Sign in to your workspace</h1>
            {demoMode && (
              <p className="text-sm text-muted-foreground">
                Demo account: <span className="font-mono text-foreground">demo@example.com</span> / <span className="font-mono text-foreground">demo123</span>
              </p>
            )}
          </div>
          {reason === 'expired' && (
            <Alert>
              <Clock className="size-4" />
              <AlertDescription>Your session expired. Sign in again to continue.</AlertDescription>
            </Alert>
          )}
          <LoginForm next={next} demoMode={demoMode} />
        </div>
      </section>
      <aside className="hidden border-l bg-muted/20 lg:flex lg:flex-col lg:justify-center lg:px-16" aria-label="Product overview">
        <div className="max-w-md space-y-6">
          <p className="text-xs font-medium uppercase tracking-wider text-primary">AI Engineering Workspace</p>
          <h2 className="text-2xl font-semibold tracking-tight text-balance">From pull request to production incident — with context at every step.</h2>
          <ul className="space-y-3 text-sm text-muted-foreground">
            <li>• Structured AI review of pull requests, grounded in the diff</li>
            <li>• Deployment analysis with logs, tests and before/after performance</li>
            <li>• Incident investigation that correlates timeline and releases</li>
            <li>• A contextual assistant available from every page</li>
          </ul>
        </div>
      </aside>
    </main>
  );
}
