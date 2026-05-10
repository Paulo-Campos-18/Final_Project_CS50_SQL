import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Required for better-sqlite3 (native module)
  serverExternalPackages: ['better-sqlite3'],
  async redirects() {
    return [
      // The KEYFORGE design SPA is served from public/keyforge/index.html.
      // Everything except /admin, /login, /api and the SPA itself sends users
      // to the design's storefront.
      { source: '/', destination: '/keyforge/index.html', permanent: false },
    ];
  },
};

export default nextConfig;
