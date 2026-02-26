import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "codeauni2.b-cdn.net",
      },
    ],
  },
};

export default nextConfig;
