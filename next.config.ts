import type { NextConfig } from 'next';

/**
 * Production CSP. Next.js streams its RSC payload through inline scripts, so
 * 'unsafe-inline' is required for scripts without a nonce setup; everything
 * else (frames, objects, base URI, form targets, network) is locked to self.
 * All AI calls happen server-side, so the browser never needs external hosts.
 */
const CONTENT_SECURITY_POLICY = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  "connect-src 'self'",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
].join('; ');

const isProduction = process.env.NODE_ENV === 'production';

const nextConfig: NextConfig = {
  // Self-contained server bundle for the Docker image.
  output: 'standalone',
  poweredByHeader: false,
  turbopack: { root: __dirname },
  reactStrictMode: true,
  experimental: {
    // Tree-shake barrel-style icon/util packages on import.
    optimizePackageImports: ['lucide-react', 'recharts', 'date-fns'],
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          ...(isProduction ? [{ key: 'Content-Security-Policy', value: CONTENT_SECURITY_POLICY }] : []),
        ],
      },
    ];
  },
};

export default nextConfig;
