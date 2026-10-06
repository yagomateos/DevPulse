import type { NextConfig } from 'next';

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
        ],
      },
    ];
  },
};

export default nextConfig;
