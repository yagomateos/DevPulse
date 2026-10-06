'use client';

import { RotateCw } from 'lucide-react';
import { Button, type ButtonProps } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface RetryButtonProps extends Omit<ButtonProps, 'onClick'> {
  onRetry: () => unknown;
  isRetrying?: boolean;
}

export function RetryButton({ onRetry, isRetrying = false, children = 'Try again', className, ...props }: RetryButtonProps) {
  return (
    <Button variant="outline" size="sm" onClick={() => onRetry()} disabled={isRetrying} className={className} {...props}>
      <RotateCw className={cn(isRetrying && 'animate-spin')} aria-hidden />
      {children}
    </Button>
  );
}
