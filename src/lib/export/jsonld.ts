import { createHash } from "node:crypto";
import { BATTERY_FIELD_MAP } from "../../config/battery-fields.ts";
import {
  projectPublicPassportFields,
  type FieldValueMap,
} from "../passport-projection.ts";

/**
 * Deterministic canonical JSON SHA-256 hash for a passport snapshot.
 * Keys are sorted lexicographically so identical snapshots always yield the same hash.
 */
export function computeCanonicalSnapshotSha256(
  fields: Record<string, string>,
): string {
  const sortedEntries = Object.keys(fields)
    .sort()
    .map((key) => [key, fields[key]]);
  const canonical = JSON.stringify(Object.fromEntries(sortedEntries));
  return createHash("sha256").update(canonical, "utf8").digest("hex");
}

export interface EuRegistryJsonLdInput {
  slug: string;
  origin: string;
  batteryCategory: string;
  recordMode?: "full_passport" | "simple_qr";
  versionNumber: number;
  declaredAt: string;
  rawFields: Record<string, unknown>;
  commodityCode?: string | null;
}

export interface EuRegistryJsonLdDocument {
  "@context": [
    string,
    string,
    {
      din99100: string;
      annexXIII: string;
    },
  ];
  "@type": string;
  "@id": string;
  "din99100:uniqueProductIdentifier": string;
  "din99100:batteryCategory": string;
  "din99100:recordMode": "full_passport" | "simple_qr";
  "din99100:commodityCode": string | null;
  "din99100:passportVersion": number;
  "din99100:declaredAt": string;
  "din99100:accessTier": "public";
  "din99100:snapshotIntegritySha256": string;
  "din99100:operatorDeclarationNotice": string;
  "annexXIII:publicAttributes": Record<
    string,
    {
      pointNumber: number | null;
      annexRef: string;
      label: string;
      value: string;
      unit?: string;
    }
  >;
}

/**
 * Build an EU DPP Registry / DIN DKE SPEC 99100 JSON-LD document.
 * Strictly projects fields through `projectPublicPassportFields()` so `legitimate_interest`,
 * `authorities_only`, and `additional_information` fields can NEVER leak.
 */
export function buildEuRegistryJsonLd({
  slug,
  origin,
  batteryCategory,
  recordMode = "full_passport",
  versionNumber,
  declaredAt,
  rawFields,
  commodityCode = null,
}: EuRegistryJsonLdInput): EuRegistryJsonLdDocument {
  const safePublic: FieldValueMap = projectPublicPassportFields(rawFields);
  const sha256 = computeCanonicalSnapshotSha256(safePublic);
  const cleanOrigin = origin.replace(/\/+$/, "");
  const canonicalUrl = `${cleanOrigin}/p/${encodeURIComponent(slug)}`;

  const publicAttributes: EuRegistryJsonLdDocument["annexXIII:publicAttributes"] =
    {};

  for (const [key, value] of Object.entries(safePublic)) {
    const def = BATTERY_FIELD_MAP[key];
    if (!def || def.tier !== "public") continue;
    publicAttributes[key] = {
      pointNumber: typeof def.pointNumber === "number" ? def.pointNumber : null,
      annexRef: def.annexRef,
      label: def.label,
      value,
      ...(def.unit ? { unit: def.unit } : {}),
    };
  }

  const rawCommodity = commodityCode?.trim() ?? "";
  const safeCommodityCode = /^[A-Za-z0-9.\-\s]{2,32}$/.test(rawCommodity)
    ? rawCommodity
    : null;

  return {
    "@context": [
      "https://schema.org",
      "https://w3id.org/dpp/v1",
      {
        din99100: "https://din.de/spec/99100#",
        annexXIII: "https://eur-lex.europa.eu/eli/reg/2023/1542/annex/XIII#",
      },
    ],
    "@type":
      recordMode === "simple_qr"
        ? "din99100:BatteryArticle13QRRecord"
        : "din99100:BatteryPassport",
    "@id": canonicalUrl,
    "din99100:uniqueProductIdentifier":
      safePublic.unique_identifier || canonicalUrl,
    "din99100:batteryCategory": batteryCategory,
    "din99100:recordMode": recordMode,
    "din99100:commodityCode": safeCommodityCode,
    "din99100:passportVersion": versionNumber,
    "din99100:declaredAt": declaredAt,
    "din99100:accessTier": "public",
    "din99100:snapshotIntegritySha256": sha256,
    "din99100:operatorDeclarationNotice":
      "Declared by economic operator using CratePass technical hosting; not verified by CratePass. Working field list - check against official regulation.",
    "annexXIII:publicAttributes": publicAttributes,
  };
}
