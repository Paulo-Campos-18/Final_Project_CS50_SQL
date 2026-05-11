import type { NextConfig } from 'next';

const isProd = process.env.NODE_ENV === 'production';

/**
 * Content-Security-Policy
 * - Allows the KEYFORGE design SPA which loads React/Tailwind/Framer/Recharts
 *   from unpkg + tailwind's CDN at runtime via <script type="text/babel">.
 * - Allows RAWG game covers (media.rawg.io).
 * - Allows inline scripts and `unsafe-eval` only because the SPA compiles JSX
 *   in-browser via @babel/standalone. When we port the SPA to real Next.js
 *   build artifacts this can drop to `script-src 'self'` and become strict.
 */
const cspHeader = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://unpkg.com https://cdn.tailwindcss.com",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdn.tailwindcss.com",
  "font-src 'self' https://fonts.gstatic.com data:",
  "img-src 'self' data: blob: https://media.rawg.io",
  "connect-src 'self'",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join('; ');

const nextConfig: NextConfig = {
  serverExternalPackages: ['better-sqlite3'],
  async redirects() {
    return [
      { source: '/', destination: '/keyforge/index.html', permanent: false },
    ];
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          { key: 'X-DNS-Prefetch-Control', value: 'on' },
          { key: 'Content-Security-Policy', value: cspHeader },
          // HSTS only when running behind HTTPS (Vercel/Cloudflare). Harmless on
          // localhost because browsers ignore it for non-https origins.
          ...(isProd
            ? [{ key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' }]
            : []),
        ],
      },
    ];
  },
};

export default nextConfig;
