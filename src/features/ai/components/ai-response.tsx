'use client';

import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

/**
 * Markdown renderer for model output. Raw HTML is not enabled (XSS-safe by
 * default); internal links use next/link for client-side navigation.
 * Loaded lazily (next/dynamic) so markdown parsing isn't in the main bundle.
 */
export default function AIResponse({ content, streaming = false }: { content: string; streaming?: boolean }) {
  return (
    <div className="prose-ai">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          a: ({ href = '', children }) =>
            href.startsWith('/') ? (
              <Link href={href}>{children}</Link>
            ) : (
              <a href={href} target="_blank" rel="noreferrer noopener">
                {children}
              </a>
            ),
        }}
      >
        {content}
      </ReactMarkdown>
      {streaming && <span className="ml-0.5 inline-block h-4 w-1.5 translate-y-0.5 animate-blink bg-primary align-baseline" aria-hidden />}
    </div>
  );
}
