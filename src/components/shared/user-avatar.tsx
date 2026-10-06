import { cn, hueFor, initials } from '@/lib/utils';

const SIZES = { xs: 'size-5 text-[9px]', sm: 'size-6 text-[10px]', md: 'size-8 text-xs', lg: 'size-10 text-sm' } as const;

interface UserAvatarProps {
  name: string;
  size?: keyof typeof SIZES;
  className?: string;
  /** Show the name as an accessible label (default: decorative when shown next to the name). */
  labelled?: boolean;
}

/** Deterministic initials avatar — no external avatar service, no layout shift. */
export function UserAvatar({ name, size = 'sm', className, labelled = false }: UserAvatarProps) {
  const hue = hueFor(name);
  return (
    <span
      role={labelled ? 'img' : undefined}
      aria-label={labelled ? name : undefined}
      aria-hidden={labelled ? undefined : true}
      title={labelled ? name : undefined}
      className={cn('avatar inline-flex shrink-0 select-none items-center justify-center rounded-full font-semibold', SIZES[size], className)}
      style={{ '--avatar-hue': hue } as React.CSSProperties}
    >
      {initials(name)}
    </span>
  );
}

export function AvatarStack({ names, max = 3, size = 'sm' }: { names: string[]; max?: number; size?: keyof typeof SIZES }) {
  const visible = names.slice(0, max);
  return (
    <span className="flex -space-x-1.5" aria-label={names.join(', ')}>
      {visible.map((n) => (
        <UserAvatar key={n} name={n} size={size} className="ring-2 ring-background" />
      ))}
      {names.length > max && <span className={cn('inline-flex items-center justify-center rounded-full bg-muted text-muted-foreground ring-2 ring-background', SIZES[size])}>+{names.length - max}</span>}
    </span>
  );
}
