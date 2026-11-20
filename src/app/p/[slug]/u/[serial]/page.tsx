import { Suspense } from "react";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { PublicPassportView } from "@/components/public-passport/PublicPassportView";
import { projectPublicPassportFields } from "@/lib/passport-projection";
import { createPublicSupabaseClient } from "@/lib/supabase/server";

async function PublicUnitPassportLoader({
  paramsPromise,
}: {
  paramsPromise: Promise<{ slug: string; serial: string }>;
}) {
  await connection();
  const { slug, serial } = await paramsPromise;
  let decodedSerial = "";
  try {
    decodedSerial = decodeURIComponent(serial || "").trim();
  } catch {
    notFound();
  }

  if (
    !slug ||
    !/^[a-z0-9-]+$/i.test(slug) ||
    !decodedSerial ||
    decodedSerial.length > 120
  ) {
    notFound();
  }

  const supabase = createPublicSupabaseClient();
  if (!supabase) {
    notFound();
  }

  const { data, error } = await supabase.rpc("get_published_passport_unit", {
    p_slug: slug.toLowerCase(),
    p_serial: decodedSerial,
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
      unitInfo={{
        serialNumber: String(row.serial_number),
        gtin: row.gtin ? String(row.gtin) : null,
        batchLot: row.batch_lot ? String(row.batch_lot) : null,
        manufacturingDate: row.manufacturing_date
          ? String(row.manufacturing_date)
          : null,
        unitStatus: String(row.unit_status ?? "active"),
      }}
    />
  );
}

export default function PublicUnitPassportPage({
  params,
}: {
  params: Promise<{ slug: string; serial: string }>;
}) {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-svh items-center justify-center bg-[var(--ground)] p-6 text-[14px] text-[var(--muted)]">
          Loading item-level battery passport...
        </div>
      }
    >
      <PublicUnitPassportLoader paramsPromise={params} />
    </Suspense>
  );
}
