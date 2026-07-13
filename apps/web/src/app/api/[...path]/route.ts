import { NextRequest, NextResponse } from "next/server";

// next.config.ts rewrites weren't being applied under this build (Turbopack +
// output: "standalone" on Next.js 16.2), so this route handler proxies
// /api/* to the backend explicitly instead. Keeping the API calls same-origin
// keeps the refresh-token cookie same-site regardless of browser settings —
// see apps/web/src/lib/api.ts.
const API_PROXY_TARGET = process.env.API_PROXY_TARGET ?? "http://localhost:4000";

async function proxy(req: NextRequest, path: string[]) {
  const target = `${API_PROXY_TARGET}/api/${path.join("/")}${req.nextUrl.search}`;

  const headers = new Headers(req.headers);
  headers.delete("host");
  headers.delete("content-length");

  const upstream = await fetch(target, {
    method: req.method,
    headers,
    body: req.method === "GET" || req.method === "HEAD" ? undefined : await req.arrayBuffer(),
    redirect: "manual",
  });

  const responseHeaders = new Headers(upstream.headers);
  responseHeaders.delete("content-encoding");
  responseHeaders.delete("content-length");
  responseHeaders.delete("transfer-encoding");

  return new NextResponse(upstream.body, {
    status: upstream.status,
    headers: responseHeaders,
  });
}

export async function GET(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  const { path } = await ctx.params;
  return proxy(req, path);
}

export { GET as POST, GET as PATCH, GET as DELETE, GET as PUT };
