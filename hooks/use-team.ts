'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

export function useTeamMembers() {
  return useQuery({
    queryKey: ['team'],
    queryFn: () => api.getTeamMembers(),
  });
}
