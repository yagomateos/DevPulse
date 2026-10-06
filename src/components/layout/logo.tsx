import { cn } from '@/lib/utils';

export function Logo({ className, withText = true }: { className?: string; withText?: boolean }) {
  return (
    <span className={cn('flex items-center gap-2', className)}>
      <span className="flex size-6 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground" aria-hidden>
        <svg viewBox="0 0 24 24" className="size-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 17 10 7l4 7 2-3 4 6" />
        </svg>
      </span>
      {withText && <span className="truncate text-sm font-semibold tracking-tight">AI Workspace</span>}
    </span>
  );
}
