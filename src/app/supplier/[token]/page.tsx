import { Suspense } from "react";
import { connection } from "next/server";
import { BATTERY_FIELD_MAP } from "@/config/battery-fields";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { normalizeSupplierLocale } from "@/lib/supplier/i18n-zh";
import {
  checkSupplierRequestActionable,
  hashSupplierToken,
  isValidSupplierTokenFormat,
  type SupplierRequestStatus,
} from "@/lib/supplier/tokens";
import {
  SupplierPortalForm,
  type SupplierRequestedFieldItem,
} from "@/components/supplier/SupplierPortalForm";

async function SupplierPortalLoader({
  paramsPromise,
}: {
  paramsPromise: Promise<{ token: string }>;
}) {
  await connection();
  const { token } = await paramsPromise;

  if (!token || !isValidSupplierTokenFormat(token)) {
    return (
      <SupplierPortalForm
        token=""
        initialLocale="zh"
        actionable={false}
        blockedReason="not_found"
        supplierName=""
        productName=""
        modelCode=""
        requestedFields={[]}
      />
    );
  }

  const admin = createAdminSupabaseClient();
  if (!admin) {
    return (
      <SupplierPortalForm
        token={token}
        initialLocale="en"
        actionable={false}
        blockedReason="not_found"
        supplierName=""
        productName=""
        modelCode=""
        requestedFields={[]}
      />
    );
  }

  const tokenHash = hashSupplierToken(token);
  const { data: reqRow, error } = await admin
    .from("supplier_requests")
    .select(
      "id, supplier_name, requested_field_keys, default_locale, status, expires_at, passports ( slug, products ( name, model_code ) )",
    )
    .eq("token_hash", tokenHash)
    .single();

  if (error || !reqRow) {
    return (
      <SupplierPortalForm
        token={token}
        initialLocale="zh"
        actionable={false}
        blockedReason="not_found"
        supplierName=""
        productName=""
        modelCode=""
        requestedFields={[]}
      />
    );
  }

  const check = checkSupplierRequestActionable({
    status: reqRow.status as SupplierRequestStatus,
    expiresAt: String(reqRow.expires_at),
  });

  const passportRel = Array.isArray(reqRow.passports)
    ? reqRow.passports[0]
    : reqRow.passports;
  const productRel = passportRel
    ? Array.isArray(passportRel.products)
      ? passportRel.products[0]
      : passportRel.products
    : null;

  const requestedKeys = Array.isArray(reqRow.requested_field_keys)
    ? (reqRow.requested_field_keys as string[])
    : [];

  const requestedFields: SupplierRequestedFieldItem[] = requestedKeys
    .map((key) => BATTERY_FIELD_MAP[key])
    .filter((f): f is NonNullable<typeof f> => Boolean(f && f.source === "static"))
    .map((f) => ({
      key: f.key,
      pointNumber: f.pointNumber,
      label: f.label,
      tier: f.tier,
      type: f.type,
      unit: f.unit,
      placeholder: f.placeholder,
    }));

  return (
    <SupplierPortalForm
      token={token}
      initialLocale={normalizeSupplierLocale(reqRow.default_locale)}
      actionable={check.actionable}
      blockedReason={check.reason}
      supplierName={String(reqRow.supplier_name ?? "")}
      productName={productRel?.name ? String(productRel.name) : "Battery Pack"}
      modelCode={productRel?.model_code ? String(productRel.model_code) : ""}
      expiresAt={String(reqRow.expires_at)}
      requestedFields={requestedFields}
    />
  );
}

export default function SupplierPortalPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-svh items-center justify-center bg-[#e8e7e3] p-6 text-[14px] text-[#4b4f57]">
          Loading supplier data form... / 正在加载 / 불러오는 중 / 読み込み中 / Đang tải...
        </div>
      }
    >
      <SupplierPortalLoader paramsPromise={params} />
    </Suspense>
  );
}
