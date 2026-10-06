'use client';

import { Check, LogOut, Palette, Settings, ShieldCheck, User as UserIcon } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { UserAvatar } from '@/components/shared/user-avatar';
import { logout, switchRole } from '@/features/auth/actions';
import { useSession } from '@/features/auth/components/session-provider';
import { useWorkspacePreferences } from '@/features/settings/components/workspace-preferences-provider';
import { ROLE_DESCRIPTIONS } from '@/lib/permissions';
import { ROLES, type Role } from '@/types/domain';
import { ThemeRadioItems } from './theme-menu';

export function UserMenu() {
  const { user } = useSession();
  const { demoMode } = useWorkspacePreferences();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isPending, startTransition] = useTransition();

  const changeRole = (role: Role) =>
    startTransition(async () => {
      await switchRole(role);
      // Server components (layouts) re-read the session; client caches are role-dependent.
      router.refresh();
      await queryClient.invalidateQueries();
      toast.success(`Now viewing as ${role.toLowerCase()}`, { description: ROLE_DESCRIPTIONS[role] });
    });

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex items-center gap-2 rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring" aria-label={`Account menu for ${user.name}`}>
        <UserAvatar name={user.name} size="md" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60">
        <DropdownMenuLabel className="font-normal">
          <p className="flex items-center gap-2 text-sm font-medium">
            {user.name}
            {demoMode && <span className="rounded bg-warning/15 px-1 text-[10px] font-medium uppercase text-warning">Demo</span>}
          </p>
          <p className="truncate text-xs text-muted-foreground">{user.email}</p>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem asChild>
            <Link href="/settings/account">
              <UserIcon className="mr-2 size-3.5" aria-hidden /> Account
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/settings">
              <Settings className="mr-2 size-3.5" aria-hidden /> Settings
            </Link>
          </DropdownMenuItem>
          {demoMode ? (
          <DropdownMenuSub>
            <DropdownMenuSubTrigger disabled={isPending}>
              <ShieldCheck className="mr-2 size-3.5" aria-hidden />
              Role: <span className="ml-1 text-muted-foreground">{user.role.toLowerCase()}</span>
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent className="w-64">
              <DropdownMenuLabel className="text-xs text-muted-foreground">Switch demo role</DropdownMenuLabel>
              {ROLES.map((role) => (
                <DropdownMenuItem key={role} onSelect={() => role !== user.role && changeRole(role)} className="items-start">
                  <Check className={role === user.role ? 'mr-2 mt-0.5 size-3.5' : 'invisible mr-2 mt-0.5 size-3.5'} aria-hidden />
                  <span>
                    <span className="block text-sm">{role.charAt(0) + role.slice(1).toLowerCase()}</span>
                    <span className="block text-xs text-muted-foreground">{ROLE_DESCRIPTIONS[role]}</span>
                  </span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuSubContent>
          </DropdownMenuSub>
          ) : (
            <DropdownMenuItem disabled>
              <ShieldCheck className="mr-2 size-3.5" aria-hidden />
              Role: <span className="ml-1 text-muted-foreground">{user.role.toLowerCase()}</span>
            </DropdownMenuItem>
          )}
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>
              <Palette className="mr-2 size-3.5" aria-hidden /> Theme
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              <ThemeRadioItems />
            </DropdownMenuSubContent>
          </DropdownMenuSub>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onSelect={() =>
            startTransition(async () => {
              queryClient.clear();
              await logout();
            })
          }
        >
          <LogOut className="mr-2 size-3.5" aria-hidden /> Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
