import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  reactStrictMode: false,
  // Removed rewrites - using API routes instead for better SSL handling
};

export default nextConfig;
