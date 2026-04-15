import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: [
    "localhost",
    "127.0.0.1",
    "192.168.68.105",
    "192.168.68.110",
  ],
};

export default nextConfig;
