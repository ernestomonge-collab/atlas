import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  trailingSlash: false,
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  // Performance optimizations
  experimental: {
    // Reduce overhead in development
    serverComponentsHmrCache: true,
    // Optimize memory usage
    optimizePackageImports: ['lucide-react', '@radix-ui/react-icons'],
    // Enable turbopack configuration
    turbo: {
      // Optimize module resolution
      resolveAlias: {
        // Add custom aliases if needed
      },
    },
  },
  // Optimize server actions and API routes
  serverExternalPackages: ['@prisma/client', 'bcrypt'],
};

export default nextConfig;
