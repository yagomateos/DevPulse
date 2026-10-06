'use client';

import { MoreHorizontal, Trash2, UserPlus } from 'lucide-react';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { DataTableColumnHeader } from '@/components/data-table/column-header';
import { DataTable, type DataTableColumn } from '@/components/data-table/data-table';
import { useDataTableUrlState } from '@/components/data-table/use-data-table-url-state';
import { RelativeTime } from '@/components/shared/relative-time';
import { UserAvatar } from '@/components/shared/user-avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { PermissionGate } from '@/features/auth/components/permission-gate';
import { useSession } from '@/features/auth/components/session-provider';
import { usePermissions } from '@/features/auth/hooks/use-permissions';
import { cn } from '@/lib/utils';
import { useDialogStore } from '@/stores/dialog-store';
import { ROLES, type Role, type TeamMember } from '@/types/domain';
import { useChangeRole, useRemoveMember, useTeam } from '../hooks/use-team';

const PRESENCE_TONE = { online: 'bg-success', away: 'bg-warning', offline: 'bg-muted-foreground/40' } as const;
const roleLabel = (r: Role) => r.charAt(0) + r.slice(1).toLowerCase();

function MemberActions({ member, onRemove }: { member: TeamMember; onRemove: (m: TeamMember) => void }) {
  const { user } = useSession();
  const { can } = usePermissions();
  const changeRole = useChangeRole();
  if (member.id === user.id || (!can('team:change-role') && !can('team:remove'))) return null;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button size="icon-sm" variant="ghost" aria-label={`Actions for ${member.name}`}>
          <MoreHorizontal />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {can('team:change-role') && (
          <>
            <DropdownMenuLabel className="text-xs text-muted-foreground">Change role</DropdownMenuLabel>
            <DropdownMenuRadioGroup
              value={member.role}
              onValueChange={(role) =>
                changeRole.mutate(
                  { id: member.id, role: role as Role },
                  {
                    onSuccess: () => toast.success(`${member.name} is now ${roleLabel(role as Role).toLowerCase()}`),
                    onError: (e) => toast.error('Role change failed and was reverted', { description: e.message }),
                  },
                )
              }
            >
              {ROLES.map((r) => (
                <DropdownMenuRadioItem key={r} value={r}>
                  {roleLabel(r)}
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </>
        )}
        {can('team:remove') && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive focus:text-destructive" onSelect={() => onRemove(member)}>
              <Trash2 className="mr-2 size-3.5" aria-hidden /> Remove member
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function TeamTable() {
  const team = useTeam();
  const remove = useRemoveMember();
  const openDialog = useDialogStore((s) => s.openDialog);
  const [pendingRemoval, setPendingRemoval] = useState<TeamMember | null>(null);
  const table = useDataTableUrlState({ filterKeys: ['role', 'status'] as const, defaultSort: { id: 'name', desc: false }, defaultPageSize: 20 });

  const columns = useMemo<DataTableColumn<TeamMember>[]>(
    () => [
      {
        id: 'name',
        accessorKey: 'name',
        meta: { label: 'Name' },
        enableHiding: false,
        header: ({ column }) => <DataTableColumnHeader column={column} title="Member" />,
        cell: ({ row }) => (
          <span className="flex items-center gap-3">
            <span className="relative">
              <UserAvatar name={row.original.name} size="md" />
              <span className={cn('absolute -bottom-0.5 -right-0.5 size-2.5 rounded-full ring-2 ring-background', PRESENCE_TONE[row.original.presence])} aria-label={row.original.presence} />
            </span>
            <span>
              <span className="block font-medium">{row.original.name}</span>
              <span className="block text-xs text-muted-foreground">{row.original.title || '—'}</span>
            </span>
          </span>
        ),
      },
      { id: 'email', accessorKey: 'email', meta: { label: 'Email' }, header: ({ column }) => <DataTableColumnHeader column={column} title="Email" />, cell: ({ getValue }) => <span className="text-muted-foreground">{getValue<string>()}</span> },
      { id: 'role', accessorKey: 'role', meta: { label: 'Role' }, header: ({ column }) => <DataTableColumnHeader column={column} title="Role" />, cell: ({ row }) => <Badge variant={row.original.role === 'ADMIN' ? 'default' : 'secondary'}>{roleLabel(row.original.role)}</Badge> },
      { id: 'status', accessorKey: 'status', meta: { label: 'Status' }, header: 'Status', enableSorting: false, cell: ({ row }) => <Badge variant={row.original.status === 'active' ? 'success' : 'warning'}>{row.original.status === 'active' ? 'Active' : 'Invited'}</Badge> },
      { id: 'lastActiveAt', accessorKey: 'lastActiveAt', meta: { label: 'Last active' }, header: ({ column }) => <DataTableColumnHeader column={column} title="Last active" />, cell: ({ row }) => (row.original.presence === 'online' ? <span className="text-xs text-success">Online now</span> : <RelativeTime value={row.original.lastActiveAt} className="text-xs text-muted-foreground" />) },
      { id: 'actions', enableHiding: false, enableSorting: false, header: () => <span className="sr-only">Actions</span>, cell: ({ row }) => <MemberActions member={row.original} onRemove={setPendingRemoval} />, size: 48 },
    ],
    [],
  );

  const confirmRemoval = () => {
    if (!pendingRemoval) return;
    const member = pendingRemoval;
    setPendingRemoval(null);
    remove.mutate(member.id, {
      onSuccess: () => toast.success(`${member.name} was removed`),
      onError: (e) => toast.error('Could not remove member — restored', { description: e.message }),
    });
  };

  return (
    <>
      <DataTable
        tableId="team"
        label="Team members"
        columns={columns}
        data={team.data}
        getRowId={(m) => m.id}
        state={table}
        onSortingChange={table.setSorting}
        onPaginationChange={table.setPagination}
        onSearchChange={table.setSearch}
        onFilterChange={(k, v) => table.setFilter(k as 'role' | 'status', v)}
        onReset={table.reset}
        facets={[
          { key: 'role', title: 'Role', options: ROLES.map((r) => ({ label: roleLabel(r), value: r })) },
          { key: 'status', title: 'Status', options: [{ label: 'Active', value: 'active' }, { label: 'Invited', value: 'invited' }] },
        ]}
        searchPlaceholder="Search people…"
        isLoading={team.isPending}
        error={team.error}
        onRetry={() => team.refetch()}
        enableSelection
        bulkActions={(rows, clear) => (
          <Button
            size="xs"
            variant="outline"
            onClick={() => {
              void navigator.clipboard.writeText(rows.map((r) => r.email).join(', '));
              toast.success(`Copied ${rows.length} email addresses`);
              clear();
            }}
          >
            Copy emails
          </Button>
        )}
        toolbarActions={
          <PermissionGate permission="team:invite">
            <Button size="sm" onClick={() => openDialog('invite-member')}>
              <UserPlus /> Invite
            </Button>
          </PermissionGate>
        }
        renderMobileCard={(m) => (
          <div className="flex items-center gap-3 rounded-lg border bg-card p-3">
            <UserAvatar name={m.name} size="md" />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-medium">{m.name}</span>
              <span className="block truncate text-xs text-muted-foreground">{m.email}</span>
            </span>
            <Badge variant="secondary">{roleLabel(m.role)}</Badge>
            <MemberActions member={m} onRemove={setPendingRemoval} />
          </div>
        )}
      />
      <Dialog open={!!pendingRemoval} onOpenChange={(open) => !open && setPendingRemoval(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Remove {pendingRemoval?.name}?</DialogTitle>
            <DialogDescription>They will immediately lose access to this workspace. You can invite them again later.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setPendingRemoval(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmRemoval}>
              Remove member
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
