import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ['undici'],
  turbopack: {},
};

export default nextConfig;
