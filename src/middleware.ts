import { NextResponse, type NextRequest } from "next/server";
import { isPrimaryAppHost } from "@/lib/branding/domain";

const RESERVED_PREFIXES = [
  "/api",
  "/app",
  "/auth",
  "/login",
  "/signup",
  "/demo",
  "/checker",
  "/pricing",
  "/supplier",
  "/service",
  "/terms",
  "/privacy",
  "/refund",
  "/disclaimer",
  "/_next",
  "/images",
  "/favicon.ico",
];

/**
 * Host-header custom domain router for Pro custom subdomains (e.g. pass.myebike.eu).
 * Maps custom domain root/slug requests cleanly onto /p/[slug] after checking
 * Supabase RPC `resolve_verified_custom_domain`.
 */
export async function middleware(request: NextRequest) {
  const host = request.headers.get("host");
  if (isPrimaryAppHost(host)) {
    return NextResponse.next();
  }

  const pathname = request.nextUrl.pathname;
  if (RESERVED_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
    return NextResponse.next();
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  if (!supabaseUrl || !supabaseAnonKey || !host) {
    return NextResponse.next();
  }

  const hostname = host.trim().toLowerCase().split(":")[0] ?? "";
  try {
    const rpcRes = await fetch(
      `${supabaseUrl.replace(/\/+$/, "")}/rest/v1/rpc/resolve_verified_custom_domain`,
      {
        method: "POST",
        headers: {
          apikey: supabaseAnonKey,
          Authorization: `Bearer ${supabaseAnonKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ p_domain: hostname }),
      },
    );

    if (!rpcRes.ok) {
      return NextResponse.next();
    }

    const rows = (await rpcRes.json()) as Array<{ org_id?: string; org_slug?: string }>;
    const matched = Array.isArray(rows) ? rows[0] : null;
    if (!matched?.org_id) {
      return NextResponse.next();
    }

    const requestHeaders = new Headers(request.headers);
    requestHeaders.set("x-cratepass-custom-domain", hostname);
    requestHeaders.set("x-cratepass-org-id", String(matched.org_id));

    // Allow clean custom domain paths:
    //   https://pass.myebike.eu/p/[slug]  -> /p/[slug]
    //   https://pass.myebike.eu/01/[gtin]/21/[serial] -> /01/[gtin]/21/[serial]
    //   https://pass.myebike.eu/[slug]    -> rewrite to /p/[slug]
    if (pathname.startsWith("/p/") || pathname.startsWith("/01/")) {
      return NextResponse.next({ request: { headers: requestHeaders } });
    }

    const cleanSlug = pathname.replace(/^\/+|\/+$/g, "");
    if (/^[a-z0-9-]+$/i.test(cleanSlug)) {
      const rewriteUrl = request.nextUrl.clone();
      rewriteUrl.pathname = `/p/${cleanSlug}`;
      return NextResponse.rewrite(rewriteUrl, {
        request: { headers: requestHeaders },
      });
    }

    return NextResponse.next({ request: { headers: requestHeaders } });
  } catch {
    return NextResponse.next();
  }
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|images/).*)"],
};
