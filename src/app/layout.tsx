import type { Metadata, Viewport } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import { Providers } from '@/components/providers/providers';
import './globals.css';

// `optional` avoids a late font swap repaint (which delayed LCP on slow
// networks); the size-adjusted fallback is used until the font is cached.
const sans = Inter({ subsets: ['latin'], variable: '--font-sans', display: 'optional' });
const mono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-mono', display: 'optional', preload: false });

export const metadata: Metadata = {
  title: { default: 'DevPulse', template: '%s · DevPulse' },
  description: 'Projects, pull requests, deployments and incidents for engineering teams — with AI analysis built into the workflow.',
  applicationName: 'DevPulse',
  robots: { index: false },
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: dark)', color: '#0c0c0e' },
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={`${sans.variable} ${mono.variable}`}>
      <body className="min-h-dvh font-sans">
        <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[100] focus:rounded-md focus:bg-primary focus:px-3 focus:py-2 focus:text-sm focus:text-primary-foreground">
          Skip to content
        </a>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
