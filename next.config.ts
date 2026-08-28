import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["ephemeris"],
  experimental: {
    serverActions: {
      bodySizeLimit: "2mb",
    },
  },
  async redirects() {
    return [
      {
        source: "/advisor",
        destination: "/jehana",
        permanent: true,
      },
      {
        source: "/echo",
        destination: "/jehana",
        permanent: true,
      },
      {
        source: "/advisor/:path*",
        destination: "/jehana",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;