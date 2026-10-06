import Link from 'next/link';
import type { ReactNode } from 'react';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export function SectionCard({ title, description, href, linkLabel = 'View all', children }: { title: string; description?: string; href?: string; linkLabel?: string; children: ReactNode }) {
  return (
    <Card>
      <CardHeader className="flex-row items-start justify-between space-y-0">
        <div className="space-y-1">
          <CardTitle>{title}</CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </div>
        {href && (
          <Link href={href} className="text-xs text-muted-foreground hover:text-foreground">
            {linkLabel} →
          </Link>
        )}
      </CardHeader>
      <div className="px-2 pb-2">{children}</div>
    </Card>
  );
}
