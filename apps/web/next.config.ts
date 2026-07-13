import type { NextConfig } from "next";

// /api/* is proxied to the backend by app/api/[...path]/route.ts (a route
// handler, not a next.config rewrite — rewrites weren't taking effect under
// Turbopack + output: "standalone" on Next.js 16.2).
const nextConfig: NextConfig = {
  output: "standalone",
};

export default nextConfig;
