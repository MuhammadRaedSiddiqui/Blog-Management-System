import type { NextConfig } from "next";

const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'os8zbf04h6.ufs.sh',
      },
    ],
  },
  serverExternalPackages: ['@prisma/client', 'prisma'],
  // Disable Turbopack due to Prisma symlink issues on Windows
  bundlePagesRouterDependencies: true,
} as NextConfig;

export default nextConfig;
