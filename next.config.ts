import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: false,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "dp4p6x0xfi5o9.cloudfront.net",
        port: "",
        pathname: "/maimai/img/cover/**",
      },
    ],
  },
};

export default nextConfig;
