'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';

/**
 * Mounts `children` only when the placeholder approaches the viewport.
 * Used for heavy, below-the-fold widgets (charts): their code is not even
 * downloaded until needed, keeping hydration and main-thread work small.
 */
export function LazyMount({ children, fallback, rootMargin = '200px' }: { children: ReactNode; fallback: ReactNode; rootMargin?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node || visible) return;
    if (typeof IntersectionObserver === 'undefined') {
      // Old browsers / test environments: mount right after this commit.
      const id = setTimeout(() => setVisible(true), 0);
      return () => clearTimeout(id);
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [visible, rootMargin]);

  return <div ref={ref}>{visible ? children : fallback}</div>;
}
