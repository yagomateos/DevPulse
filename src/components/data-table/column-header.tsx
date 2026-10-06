'use client';

import type { Column } from '@tanstack/react-table';
import { ArrowDown, ArrowUp, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props<TData, TValue> {
  column: Column<TData, TValue>;
  title: string;
  className?: string;
  align?: 'left' | 'right';
}

/** Sortable header rendered as a real button; announces sort direction. */
export function DataTableColumnHeader<TData, TValue>({ column, title, className, align = 'left' }: Props<TData, TValue>) {
  if (!column.getCanSort()) return <span className={cn(align === 'right' && 'block text-right', className)}>{title}</span>;
  const sorted = column.getIsSorted();
  const Icon = sorted === 'asc' ? ArrowUp : sorted === 'desc' ? ArrowDown : ChevronsUpDown;
  return (
    <button
      type="button"
      onClick={() => column.toggleSorting(sorted === 'asc')}
      className={cn(
        '-mx-1.5 inline-flex items-center gap-1 rounded px-1.5 py-1 hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        sorted && 'text-foreground',
        align === 'right' && 'ml-auto flex flex-row-reverse',
        className,
      )}
      aria-label={`Sort by ${title}${sorted ? ` (currently ${sorted === 'asc' ? 'ascending' : 'descending'})` : ''}`}
    >
      {title}
      <Icon className={cn('size-3', !sorted && 'opacity-40')} aria-hidden />
    </button>
  );
}
