import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ['@xekko/core', '@xekko/core/client'],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'api.dicebear.com',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
    ],
  },
};

export default nextConfig;
