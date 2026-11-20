import { Suspense } from "react";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { ServicePortalForm } from "@/components/service/ServicePortalForm";
import { projectPublicPassportFields } from "@/lib/passport-projection";
import { createPublicSupabaseClient } from "@/lib/supabase/server";

async function UnitServicePortalLoader({
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

  if (!slug || !/^[a-z0-9-]+$/i.test(slug) || !decodedSerial) {
    notFound();
  }

  const supabase = createPublicSupabaseClient();
  if (!supabase) notFound();

  const { data, error } = await supabase.rpc("get_published_passport", {
    p_slug: slug.toLowerCase(),
  });
  if (error || !data) notFound();

  const row = Array.isArray(data) ? data[0] : data;
  if (!row || !row.snapshot_public_fields) notFound();

  const pub = projectPublicPassportFields(
    row.snapshot_public_fields as Record<string, unknown>,
  );

  return (
    <ServicePortalForm
      slug={String(row.slug)}
      productName={pub.model_serial_number || String(row.slug)}
      manufacturerName={pub.manufacturer_name || "Economic Operator"}
      serialNumber={decodedSerial}
    />
  );
}

export default function UnitServicePortalPage({
  params,
}: {
  params: Promise<{ slug: string; serial: string }>;
}) {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-svh items-center justify-center bg-[#e8e7e3] p-6 text-[14px] text-[#4b4f57]">
          Loading Unit Service SoH Portal...
        </div>
      }
    >
      <UnitServicePortalLoader paramsPromise={params} />
    </Suspense>
  );
}
