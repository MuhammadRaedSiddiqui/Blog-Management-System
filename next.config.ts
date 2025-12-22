import type { NextConfig } from "next";

const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  serverExternalPackages: ['@prisma/client', 'prisma'],
  // Disable Turbopack due to Prisma symlink issues on Windows
  bundlePagesRouterDependencies: true,
} as NextConfig;

export default nextConfig;
