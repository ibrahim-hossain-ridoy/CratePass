import {
  DYNAMIC_BMS_FIELDS,
  OFFICIAL_71_FIELDS,
  OFFICIAL_STATIC_FIELDS,
  isStaticBlockingFieldForCategory,
  type BatteryCategory,
} from "../../config/battery-fields.ts";
import { projectPublicPassportFields } from "../passport-projection.ts";
import { computeCanonicalSnapshotSha256 } from "./jsonld.ts";
import {
  buildMultiPagePdf,
  pdfEscapeText,
  truncatePdfText,
} from "./pdf-builder.ts";

export interface AuditVersionItem {
  versionNumber: number;
  declaredAt: string;
  sha256: string;
}

export interface AuditDataPackageInput {
  orgName: string;
  productName: string;
  modelCode: string;
  slug: string;
  publicUrl: string;
  batteryCategory: BatteryCategory;
  recordMode: "full_passport" | "simple_qr";
  status: "draft" | "published";
  workingFields: Record<string, string>;
  versions: AuditVersionItem[];
  exportedAtIso?: string;
}

const AUDIT_FOOTER_DISCLAIMER =
  "Prepared by economic operator using CratePass technical hosting; not verified by CratePass.";

/**
 * Generate a multi-page Audit Data Package PDF with:
 * - Economic operator declaration metadata
 * - 71-point Annex XIII completeness breakdown (50 static / 21 dynamic BMS)
 * - Immutable version history with timestamps and SHA-256 snapshot integrity hashes
 * - Explicit non-verification footer disclaimer on every page
 */
export function buildAuditDataPackagePdf(
  input: AuditDataPackageInput,
): Uint8Array {
  const exportedAt = (input.exportedAtIso ?? new Date().toISOString())
    .slice(0, 19)
    .replace("T", " ") + " UTC";

  const populatedStaticCount = OFFICIAL_STATIC_FIELDS.filter(
    (f) => (input.workingFields[f.key] ?? "").trim().length > 0,
  ).length;

  const requiredStatic = OFFICIAL_STATIC_FIELDS.filter((f) =>
    isStaticBlockingFieldForCategory(f, input.batteryCategory),
  );
  const populatedRequiredStatic = requiredStatic.filter(
    (f) => (input.workingFields[f.key] ?? "").trim().length > 0,
  ).length;

  const publicTotal = OFFICIAL_71_FIELDS.filter((f) => f.tier === "public").length;
  const legitTotal = OFFICIAL_71_FIELDS.filter(
    (f) => f.tier === "legitimate_interest",
  ).length;
  const authTotal = OFFICIAL_71_FIELDS.filter(
    (f) => f.tier === "authorities_only",
  ).length;

  const publicPopulated = OFFICIAL_71_FIELDS.filter(
    (f) =>
      f.tier === "public" &&
      (input.workingFields[f.key] ?? "").trim().length > 0,
  ).length;
  const legitPopulated = OFFICIAL_71_FIELDS.filter(
    (f) =>
      f.tier === "legitimate_interest" &&
      (input.workingFields[f.key] ?? "").trim().length > 0,
  ).length;
  const authPopulated = OFFICIAL_71_FIELDS.filter(
    (f) =>
      f.tier === "authorities_only" &&
      (input.workingFields[f.key] ?? "").trim().length > 0,
  ).length;

  const safePublic = projectPublicPassportFields(input.workingFields);
  const currentDraftPublicHash = computeCanonicalSnapshotSha256(safePublic);

  const pageStreams: string[] = [];
  let ops: string[] = [];
  let y = 795;

  function addFooter(pageNum: number) {
    ops.push("0.84 0.84 0.82 RG 0.6 w 40 34 m 555 34 l S");
    ops.push("0.35 0.37 0.40 rg");
    ops.push(
      `BT /F1 7.5 Tf 40 20 Td (${pdfEscapeText(AUDIT_FOOTER_DISCLAIMER)}) Tj ET`,
    );
    ops.push(
      `BT /F1 7.5 Tf 518 20 Td (${pdfEscapeText(`Page ${pageNum}`)}) Tj ET`,
    );
  }

  function flushPage() {
    addFooter(pageStreams.length + 1);
    pageStreams.push(ops.join("\n"));
    ops = [];
    y = 795;
  }

  function ensureSpace(needed: number) {
    if (y - needed < 54) {
      flushPage();
    }
  }

  function addHeading(text: string) {
    ensureSpace(28);
    ops.push("0.08 0.36 0.43 rg");
    ops.push(`BT /F2 12 Tf 40 ${y.toFixed(1)} Td (${pdfEscapeText(text)}) Tj ET`);
    y -= 6;
    ops.push(`0.85 0.85 0.83 RG 0.6 w 40 ${y.toFixed(1)} m 555 ${y.toFixed(1)} l S`);
    y -= 14;
  }

  function addKeyVal(label: string, value: string) {
    ensureSpace(16);
    ops.push("0.32 0.34 0.37 rg");
    ops.push(
      `BT /F2 9 Tf 40 ${y.toFixed(1)} Td (${pdfEscapeText(truncatePdfText(label, 34))}) Tj ET`,
    );
    ops.push("0.06 0.07 0.08 rg");
    ops.push(
      `BT /F1 9 Tf 205 ${y.toFixed(1)} Td (${pdfEscapeText(truncatePdfText(value, 66))}) Tj ET`,
    );
    y -= 14;
  }

  // Page 1 Header Band
  ops.push("0.06 0.07 0.08 rg 40 755 515 56 re f");
  ops.push("1 1 1 rg");
  ops.push(
    `BT /F2 15 Tf 54 788 Td (${pdfEscapeText("CratePass - Audit Data Package")}) Tj ET`,
  );
  ops.push("0.76 0.78 0.82 rg");
  ops.push(
    `BT /F1 9 Tf 54 770 Td (${pdfEscapeText(
      `Regulation (EU) 2023/1542 Technical Record Summary  |  Exported ${exportedAt}`,
    )}) Tj ET`,
  );
  y = 735;

  // Section 1: Economic Operator Declaration Metadata
  addHeading("1. Economic Operator & Passport Metadata");
  addKeyVal("Economic Operator Workspace", input.orgName);
  addKeyVal("Battery Product Name", input.productName);
  addKeyVal("Model / SKU Code", input.modelCode || "Not specified");
  addKeyVal(
    "Record Mode",
    input.recordMode === "simple_qr"
      ? "Simple QR Mode (Article 13(6) Non-Passport Battery)"
      : "Full 71-Point Digital Battery Passport (Annex XIII)",
  );
  addKeyVal("Battery Category", input.batteryCategory);
  addKeyVal("Publication Status", input.status.toUpperCase());
  addKeyVal("Public Route URL", input.publicUrl);
  addKeyVal("Current Public Snapshot SHA-256", currentDraftPublicHash);
  addKeyVal(
    "Working Field List Notice",
    "Working field list - check against official regulation.",
  );
  y -= 8;

  // Section 2: 71-Point Completeness Breakdown
  addHeading("2. 71-Point Annex XIII Completeness Check (50 static | 21 dynamic BMS)");
  addKeyVal(
    "Static Datasheet Points (Points 1-50)",
    `${populatedStaticCount} / ${OFFICIAL_STATIC_FIELDS.length} populated`,
  );
  addKeyVal(
    `Required Static for ${input.batteryCategory}`,
    `${populatedRequiredStatic} / ${requiredStatic.length} populated`,
  );
  addKeyVal(
    "Dynamic In-Service BMS Points (51-71)",
    `${DYNAMIC_BMS_FIELDS.length} points (tracked in dynamic BMS telemetry logs)`,
  );
  addKeyVal(
    "Public Tier Breakdown",
    `${publicPopulated} / ${publicTotal} populated (visible on /p/${input.slug})`,
  );
  addKeyVal(
    "Legitimate Interest Tier Breakdown",
    `${legitPopulated} / ${legitTotal} populated (stored privately)`,
  );
  addKeyVal(
    "Authorities Only Tier Breakdown",
    `${authPopulated} / ${authTotal} populated (stored privately)`,
  );
  y -= 8;

  // Section 3: Immutable Version History
  addHeading("3. Immutable Published Version History & Integrity Hashes");
  if (input.versions.length === 0) {
    addKeyVal("Published Snapshots", "No published versions yet (working draft only).");
  } else {
    for (const ver of input.versions.slice(0, 15)) {
      const ts = ver.declaredAt.slice(0, 19).replace("T", " ") + " UTC";
      addKeyVal(
        `Version v${ver.versionNumber} (${ts})`,
        `SHA-256: ${ver.sha256}`,
      );
    }
  }
  y -= 8;

  // Section 4: Declared Public Tier Attributes
  addHeading("4. Declared Public Tier Attributes");
  const publicEntries = Object.entries(safePublic);
  if (publicEntries.length === 0) {
    addKeyVal("Public Fields", "No public fields populated yet.");
  } else {
    for (const [key, val] of publicEntries) {
      const def = OFFICIAL_71_FIELDS.find((f) => f.key === key);
      const label = def
        ? `#${def.pointNumber} ${def.label}`
        : key;
      const formattedVal = def?.unit ? `${val} ${def.unit}` : val;
      addKeyVal(label, formattedVal);
    }
  }

  flushPage();
  return buildMultiPagePdf(pageStreams);
}
