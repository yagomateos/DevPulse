'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import { queryKeys } from '@/lib/query-keys';
import type { AIAnalysisKind } from '@/schemas/ai';
import { aiQueries, aiService, type AnalysisTarget } from '@/services/ai';

/**
 * Loads the latest stored analysis for a target and exposes `analyze()`.
 * The mutation writes its result straight into the query cache, so every
 * component reading this target updates without a refetch.
 */
export function useAIAnalysis<K extends AIAnalysisKind>(target: AnalysisTarget<K>) {
  const queryClient = useQueryClient();
  const latest = useQuery(aiQueries.latest(target));
  const mutation = useMutation({
    mutationFn: () => aiService.analyze(target),
    onSuccess: (envelope) => queryClient.setQueryData(queryKeys.ai.analysis(target.kind, target.projectId, target.key), envelope),
  });

  const { mutate } = mutation;
  const analyze = useCallback(() => mutate(), [mutate]);

  return {
    analysis: latest.data ?? null,
    isLoadingPrevious: latest.isPending,
    analyze,
    isAnalyzing: mutation.isPending,
    error: mutation.error,
    reset: mutation.reset,
  };
}

export function useAIStatus() {
  return useQuery(aiQueries.status());
}
