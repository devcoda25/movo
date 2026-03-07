import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Don't use static export - we'll run dev server for Capacitor
  // React strict mode
  reactStrictMode: true,

  // Environment variables exposed to the app
  env: {
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'https://movo.app',
  },

  // Compiler options
  compiler: {
    // Remove console logs in production
    removeConsole: process.env.NODE_ENV === 'production',
  },

  // Allow any origin in development for Capacitor
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'ALLOWALL',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
