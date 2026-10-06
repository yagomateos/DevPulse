'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query-keys';
import type { ProjectSettingsInput } from '@/schemas/project';
import { projectQueries, projectsService } from '@/services/projects';
import type { Project } from '@/types/domain';

export function useProjects(q?: string) {
  return useQuery(projectQueries.list(q));
}

export function useProject(projectId: string) {
  return useQuery(projectQueries.detail(projectId));
}

export function useCreateProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: projectsService.create,
    onSuccess: (project) => {
      queryClient.setQueryData(queryKeys.projects.detail(project.id), project);
      return queryClient.invalidateQueries({ queryKey: queryKeys.projects.all });
    },
  });
}

/** Optimistic settings update: header and lists reflect the change immediately. */
export function useUpdateProject(projectId: string) {
  const queryClient = useQueryClient();
  const key = queryKeys.projects.detail(projectId);
  return useMutation({
    mutationFn: (input: ProjectSettingsInput) => projectsService.update(projectId, input),
    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<Project>(key);
      if (previous) queryClient.setQueryData<Project>(key, { ...previous, ...input, description: input.description ?? previous.description });
      return { previous };
    },
    onError: (_e, _v, ctx) => ctx?.previous && queryClient.setQueryData(key, ctx.previous),
    onSettled: () => queryClient.invalidateQueries({ queryKey: queryKeys.projects.all }),
  });
}
