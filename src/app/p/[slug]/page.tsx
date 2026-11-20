import { Suspense } from "react";
import { notFound } from "next/navigation";
import { PublicPassportView } from "@/components/public-passport/PublicPassportView";
import { projectPublicPassportFields } from "@/lib/passport-projection";
import { createPublicSupabaseClient } from "@/lib/supabase/server";

async function PublicPassportLoader({
  paramsPromise,
}: {
  paramsPromise: Promise<{ slug: string }>;
}) {
  const { slug } = await paramsPromise;
  if (!slug || !/^[a-z0-9-]+$/i.test(slug)) {
    notFound();
  }

  const supabase = createPublicSupabaseClient();
  if (!supabase) {
    notFound();
  }

  const { data, error } = await supabase.rpc("get_published_passport", {
    p_slug: slug.toLowerCase(),
  });

  if (error || !data) {
    notFound();
  }

  const row = Array.isArray(data) ? data[0] : data;
  if (!row || !row.snapshot_public_fields) {
    notFound();
  }

  const safePublicFields = projectPublicPassportFields(
    row.snapshot_public_fields as Record<string, unknown>,
  );

  return (
    <PublicPassportView
      slug={String(row.slug)}
      versionNumber={Number(row.version_number ?? 1)}
      declaredAt={String(row.declared_at ?? row.published_at ?? "")}
      publicFields={safePublicFields}
      recordMode={row.record_mode === "simple_qr" ? "simple_qr" : "full_passport"}
      hasUploadedDoc={Boolean(row.simple_qr_doc_path)}
      branding={{
        logoUrl: row.brand_logo_url ? String(row.brand_logo_url) : null,
        accentHex: row.brand_accent_hex ? String(row.brand_accent_hex) : null,
      }}
    />
  );
}

export default function PublicPassportPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-svh items-center justify-center bg-[var(--ground)] p-6 text-[14px] text-[var(--muted)]">
          Loading battery passport...
        </div>
      }
    >
      <PublicPassportLoader paramsPromise={params} />
    </Suspense>
  );
}
