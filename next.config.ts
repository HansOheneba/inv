import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
  async rewrites() {
    return [
      {
        source: "/catalog/:path*",
        destination: "/api/catalog/:path*",
      },
      {
        source: "/orders/:path*",
        destination: "/api/orders/:path*",
      },
      {
        source: "/auth/:path*",
        destination: "/api/auth/:path*",
      },
      {
        source: "/customer/:path*",
        destination: "/api/customer/:path*",
      },
    ];
  },
};

export default nextConfig;
