import type { NextConfig } from "next";

// Proxies /api/* through this Next.js server to the backend, so the browser
// only ever talks to this site's own origin. Without this, the API lives on
// a different registrable domain (e.g. Cloud Run's *.run.app), which makes
// the refresh-token cookie a third-party cookie — browsers increasingly
// block those by default, silently breaking session refresh in production.
const apiProxyTarget = process.env.API_PROXY_TARGET ?? "http://localhost:4000";

const nextConfig: NextConfig = {
  output: "standalone",
  async rewrites() {
    return [{ source: "/api/:path*", destination: `${apiProxyTarget}/api/:path*` }];
  },
};

export default nextConfig;
