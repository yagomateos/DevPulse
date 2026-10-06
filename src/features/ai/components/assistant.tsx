'use client';

import { Database, Quote, Wrench } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useProjects } from '@/features/projects/hooks/use-projects';
import { useUrlState } from '@/hooks/use-url-state';
import type { AIContext } from '@/schemas/ai';
import { useAIStatus } from '../hooks/use-ai-analysis';
import { ChatWindow } from './chat-window';

const WORKSPACE = 'workspace';

/** Full-page assistant. Context (workspace or a project) is URL state. */
export function Assistant() {
  const url = useUrlState();
  const projects = useProjects();
  const status = useAIStatus();
  const projectId = url.get('project');
  const project = projects.data?.find((p) => p.id === projectId);
  const context: AIContext = project ? { type: 'project', id: project.id, label: project.name } : { type: 'workspace', id: null, label: 'Workspace' };

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_280px]">
      <Card className="h-[calc(100dvh-11rem)] min-h-[480px] overflow-hidden">
        <ChatWindow key={context.id ?? WORKSPACE} context={context} autoFocus />
      </Card>
      <aside className="space-y-4 text-sm" aria-label="Assistant settings">
        <div className="space-y-1.5">
          <label htmlFor="ai-scope" className="text-xs font-medium text-muted-foreground">
            Scope
          </label>
          <Select value={projectId ?? WORKSPACE} onValueChange={(v) => url.set({ project: v === WORKSPACE ? null : v })}>
            <SelectTrigger id="ai-scope">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={WORKSPACE}>Entire workspace</SelectItem>
              {projects.data?.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <ul className="space-y-3 rounded-lg border p-3 text-xs text-muted-foreground">
          <li className="flex gap-2">
            <Database className="mt-0.5 size-3.5 shrink-0 text-primary" aria-hidden />
            Answers come from live workspace data via tool calls (incidents, deployments, PRs, health).
          </li>
          <li className="flex gap-2">
            <Quote className="mt-0.5 size-3.5 shrink-0 text-primary" aria-hidden />
            Every answer cites the records it used — click a source to open it.
          </li>
          <li className="flex gap-2">
            <Wrench className="mt-0.5 size-3.5 shrink-0 text-primary" aria-hidden />
            Model: <span className="font-mono text-foreground">{status.data?.model ?? '…'}</span>
            {status.data && !status.data.live && ' (set AI_API_KEY to use a real LLM)'}
          </li>
        </ul>
      </aside>
    </div>
  );
}
