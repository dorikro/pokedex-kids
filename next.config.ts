import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  images: {
    unoptimized: true,
  },
  // Ensure the Pokemon data JSON is included in the standalone output
  outputFileTracingIncludes: {
    "/api/*": ["data/**/*"],
  },
};

export default nextConfig;
