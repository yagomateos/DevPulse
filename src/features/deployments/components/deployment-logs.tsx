'use client';

import { Copy, Search, WrapText } from 'lucide-react';
import { useDeferredValue, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Highlight } from '@/features/search/components/highlight';
import { cn } from '@/lib/utils';
import type { LogEntry, LogLevel } from '@/types/domain';
import { useDateFormatter } from '@/features/settings/components/workspace-preferences-provider';

const LEVELS: LogLevel[] = ['info', 'warn', 'error'];
const LEVEL_TONE: Record<LogLevel, string> = { debug: 'text-muted-foreground', info: 'text-info', warn: 'text-warning', error: 'text-destructive' };

/**
 * Log viewer with level filtering, search highlighting and line wrapping.
 * useDeferredValue keeps typing responsive while the list re-filters.
 */
export function DeploymentLogs({ logs }: { logs: LogEntry[] }) {
  const formatDate = useDateFormatter();
  const [levels, setLevels] = useState<string[]>(LEVELS);
  const [search, setSearch] = useState('');
  const [wrap, setWrap] = useState(false);
  const deferredSearch = useDeferredValue(search);

  const counts = useMemo(() => Object.fromEntries(LEVELS.map((l) => [l, logs.filter((e) => e.level === l).length])), [logs]);
  const visible = useMemo(() => {
    const term = deferredSearch.toLowerCase();
    return logs.filter((l) => levels.includes(l.level) && (!term || l.message.toLowerCase().includes(term) || l.source.includes(term)));
  }, [logs, levels, deferredSearch]);

  const copy = async () => {
    await navigator.clipboard.writeText(visible.map((l) => `${l.timestamp} ${l.level.toUpperCase()} [${l.source}] ${l.message}`).join('\n'));
    toast.success(`Copied ${visible.length} log lines`);
  };

  return (
    <div className="overflow-hidden rounded-lg border">
      <div className="flex flex-wrap items-center gap-2 border-b bg-muted/30 p-2">
        <div className="relative w-full sm:w-56">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Filter logs…" aria-label="Filter logs" className="h-8 pl-8 text-[13px]" type="search" />
        </div>
        <ToggleGroup type="multiple" value={levels} onValueChange={setLevels} aria-label="Log levels">
          {LEVELS.map((l) => (
            <ToggleGroupItem key={l} value={l} className="capitalize">
              <span className={cn('size-1.5 rounded-full bg-current', LEVEL_TONE[l])} aria-hidden />
              {l} <span className="font-mono text-muted-foreground">{counts[l]}</span>
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
        <div className="ml-auto flex items-center gap-1">
          <Button size="icon-sm" variant={wrap ? 'secondary' : 'ghost'} onClick={() => setWrap((w) => !w)} aria-pressed={wrap} aria-label="Wrap lines">
            <WrapText />
          </Button>
          <Button size="icon-sm" variant="ghost" onClick={copy} aria-label="Copy visible logs">
            <Copy />
          </Button>
        </div>
      </div>
      <div className="max-h-[480px] overflow-auto bg-background font-mono text-[12px] leading-6 scrollbar-thin" role="log" aria-label="Deployment logs" tabIndex={0}>
        {visible.length === 0 ? (
          <p className="p-6 text-center font-sans text-sm text-muted-foreground">No log lines match the current filters.</p>
        ) : (
          <ol>
            {visible.map((l, i) => (
              <li key={l.id} className={cn('flex gap-3 px-3 hover:bg-muted/40', l.level === 'error' && 'bg-destructive/5', l.level === 'warn' && 'bg-warning/5')}>
                <span className="w-6 shrink-0 select-none text-right text-muted-foreground/60">{i + 1}</span>
                <span className="shrink-0 text-muted-foreground">{formatDate(l.timestamp, 'time-seconds')}</span>
                <span className={cn('w-11 shrink-0 font-semibold uppercase', LEVEL_TONE[l.level])}>{l.level}</span>
                <span className="w-24 shrink-0 truncate text-muted-foreground">[{l.source}]</span>
                <span className={cn(wrap ? 'whitespace-pre-wrap break-all' : 'whitespace-pre')}>
                  <Highlight text={l.message} query={deferredSearch} />
                </span>
              </li>
            ))}
          </ol>
        )}
      </div>
    </div>
  );
}
