import { NextResponse } from "next/server";
import { buildEuRegistryJsonLd } from "@/lib/export/jsonld";
import { createPublicSupabaseClient } from "@/lib/supabase/server";

function resolvePublicOrigin(request: Request): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (
    configured &&
    /^https?:\/\//i.test(configured) &&
    !configured.includes("localhost")
  ) {
    return configured.replace(/\/+$/, "");
  }
  const url = new URL(request.url);
  return `${url.protocol}//${url.host}`;
}

/**
 * Machine-readable EU DPP Registry JSON-LD endpoint: /p/[slug]/passport.jsonld
 * Returns strictly public-tier attributes (never legitimate_interest, authorities_only, or additional_information).
 */
export async function GET(
  request: Request,
  context: { params: Promise<{ slug: string }> },
) {
  const { slug } = await context.params;
  if (!slug || !/^[a-z0-9-]+$/i.test(slug)) {
    return NextResponse.json({ error: "Invalid passport slug." }, { status: 400 });
  }

  const supabase = createPublicSupabaseClient();
  if (!supabase) {
    return NextResponse.json(
      { error: "Public passport service unavailable." },
      { status: 503 },
    );
  }

  const { data, error } = await supabase.rpc("get_published_passport", {
    p_slug: slug.toLowerCase(),
  });

  if (error || !data) {
    return NextResponse.json({ error: "Published passport not found." }, { status: 404 });
  }

  const row = Array.isArray(data) ? data[0] : data;
  if (!row || !row.snapshot_public_fields) {
    return NextResponse.json({ error: "Published passport not found." }, { status: 404 });
  }

  const reqUrl = new URL(request.url);
  const commodityCode = reqUrl.searchParams.get("commodityCode");

  const document = buildEuRegistryJsonLd({
    slug: String(row.slug),
    origin: resolvePublicOrigin(request),
    batteryCategory: String(row.battery_category ?? "LMT"),
    recordMode: row.record_mode === "simple_qr" ? "simple_qr" : "full_passport",
    versionNumber: Number(row.version_number ?? 1),
    declaredAt: String(row.declared_at ?? row.published_at ?? ""),
    rawFields: row.snapshot_public_fields as Record<string, unknown>,
    commodityCode,
  });

  return new NextResponse(JSON.stringify(document, null, 2), {
    status: 200,
    headers: {
      "Content-Type": "application/ld+json; charset=utf-8",
      "Cache-Control": "public, max-age=60, s-maxage=300",
    },
  });
}
