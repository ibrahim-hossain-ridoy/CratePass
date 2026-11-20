import { NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { createPublicSupabaseClient } from "@/lib/supabase/server";

/**
 * Public EU Declaration of Conformity PDF download endpoint for published Simple QR passports.
 * Strictly streams the DoC PDF ONLY when the passport is currently published.
 */
export async function GET(
  _request: Request,
  context: { params: Promise<{ slug: string }> },
) {
  const { slug } = await context.params;
  if (!slug || !/^[a-z0-9-]+$/i.test(slug)) {
    return NextResponse.json({ error: "Invalid slug." }, { status: 400 });
  }

  const publicSupabase = createPublicSupabaseClient();
  const admin = createAdminSupabaseClient();
  if (!publicSupabase || !admin) {
    return NextResponse.json({ error: "Document service unavailable." }, { status: 503 });
  }

  const { data, error } = await publicSupabase.rpc("get_published_passport", {
    p_slug: slug.toLowerCase(),
  });

  if (error || !data) {
    return NextResponse.json({ error: "Published document not found." }, { status: 404 });
  }

  const row = Array.isArray(data) ? data[0] : data;
  const docPath = row?.simple_qr_doc_path ? String(row.simple_qr_doc_path) : "";
  if (
    row?.record_mode !== "simple_qr" ||
    !/^[0-9a-f-]{36}\/doc\/[0-9a-f-]{36}\.pdf$/i.test(docPath)
  ) {
    return NextResponse.json(
      { error: "No uploaded EU Declaration of Conformity PDF attached." },
      { status: 404 },
    );
  }

  const { data: fileBlob, error: dlErr } = await admin.storage
    .from("spec-pdfs")
    .download(docPath);

  if (dlErr || !fileBlob) {
    return NextResponse.json({ error: "Document could not be retrieved." }, { status: 404 });
  }

  const bytes = new Uint8Array(await fileBlob.arrayBuffer());
  return new NextResponse(Buffer.from(bytes), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${slug}-eu-doc.pdf"`,
      "Cache-Control": "public, max-age=300",
      "X-Content-Type-Options": "nosniff",
      "Content-Security-Policy": "sandbox",
    },
  });
}
