'use client';

import { useTeamMembers } from '@/hooks/use-team';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ErrorState, EmptyState } from '@/components/shared/states';
import { formatRelativeTime } from '@/lib/format';
import { cn } from '@/lib/utils';
import { UserPlus, MoreHorizontal, Mail, Users } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { Role } from '@/types';
import { toast } from 'sonner';

const roleColors: Record<Role, string> = {
  ADMIN: 'border-primary/30 bg-primary/10 text-primary',
  MANAGER: 'border-info/30 bg-info/10 text-info',
  DEVELOPER: 'border-success/30 bg-success/10 text-success',
};

const statusColors: Record<string, string> = {
  online: 'bg-success',
  away: 'bg-warning',
  offline: 'bg-muted-foreground',
};

export default function TeamPage() {
  const { data: members, isLoading, isError, refetch } = useTeamMembers();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-32 w-full rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (isError) {
    return <ErrorState title="Failed to load team members" onRetry={refetch} />;
  }

  if (!members || members.length === 0) {
    return <EmptyState title="No team members" icon={Users} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Team</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {members.length} members in your workspace
          </p>
        </div>
        <Button className="gap-2" onClick={() => toast.info('Invite feature is ready to wire up')}>
          <UserPlus className="h-4 w-4" />
          Invite Member
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {members.map((member) => (
          <Card key={member.id} className="transition-colors hover:bg-accent/30">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="relative">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={member.avatarUrl} alt={member.name} />
                    <AvatarFallback>{member.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <span
                    className={cn(
                      'absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-card',
                      statusColors[member.status]
                    )}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold truncate">{member.name}</h3>
                  <p className="text-xs text-muted-foreground truncate flex items-center gap-1 mt-0.5">
                    <Mail className="h-3 w-3" />
                    {member.email}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant="outline" className={cn('text-xs', roleColors[member.role])}>
                      {member.role}
                    </Badge>
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0">
                      <MoreHorizontal className="h-3.5 w-3.5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => toast.info(`Role change for ${member.name}`)}>
                      Change Role
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => toast.info(`Removed ${member.name}`)}>
                      Remove Member
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <p className="text-xs text-muted-foreground mt-3 pt-3 border-t">
                Last active {formatRelativeTime(member.lastActive)}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
