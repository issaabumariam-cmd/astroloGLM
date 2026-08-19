import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["ephemeris"],
  experimental: {
    serverActions: {
      bodySizeLimit: "2mb",
    },
  },
};

export default nextConfig;