import {
  BATTERY_FIELDS,
  BATTERY_FIELD_MAP,
  type BatteryFieldDefinition,
  type FieldGroupId,
} from "../config/battery-fields.ts";

export type RealPassportTabId = "passport" | "repair" | "supply" | "provenance";

export type FieldValueMap = Record<string, string>;

export interface TieredPassportSnapshots {
  snapshotAllFields: FieldValueMap;
  snapshotPublicFields: FieldValueMap;
  snapshotLegitimateInterestFields: FieldValueMap;
  snapshotAuthoritiesOnlyFields: FieldValueMap;
}

const UNSAFE_URI_PATTERN = /^\s*(javascript|data|vbscript):/i;

/** Sanitize a single field string before persistence or rendering (strips HTML tags & unsafe URIs). */
export function sanitizeFieldValue(raw: unknown, maxChars = 4000): string {
  if (raw === null || raw === undefined) return "";
  const str = String(raw)
    .replace(/<[^>]*>/g, "")
    .trim();
  if (!str) return "";
  if (UNSAFE_URI_PATTERN.test(str)) {
    return "";
  }
  return str.slice(0, maxChars);
}

/** Keep only known keys from BATTERY_FIELDS and sanitize string values (respecting per-field maxChars). */
export function normalizeFieldValues(
  raw: Record<string, unknown> | null | undefined,
): FieldValueMap {
  const clean: FieldValueMap = {};
  if (!raw || typeof raw !== "object") return clean;

  for (const field of BATTERY_FIELDS) {
    const ceiling = field.maxChars ?? 4000;
    const val = sanitizeFieldValue(raw[field.key], ceiling);
    if (val) {
      clean[field.key] = val;
    }
  }
  return clean;
}

/**
 * Project a full passport field map down strictly to `tier === "public"` fields.
 * Never returns `legitimate_interest`, `authorities_only`, `additional_information`, or unknown keys.
 */
export function projectPublicPassportFields(
  allFields: Record<string, unknown> | null | undefined,
): FieldValueMap {
  const normalized = normalizeFieldValues(allFields);
  const publicOnly: FieldValueMap = {};

  for (const [key, value] of Object.entries(normalized)) {
    if (key === "additional_information") continue;
    const def = BATTERY_FIELD_MAP[key];
    if (def && def.tier === "public") {
      publicOnly[key] = value;
    }
  }
  return publicOnly;
}

/**
 * Partition normalized fields into all 3 Annex XIII tiers (`public`, `legitimate_interest`, `authorities_only`).
 * `additional_information` is always routed to `legitimate_interest` (private) and never `public`.
 */
export function projectTieredPassportSnapshots(
  allFields: Record<string, unknown> | null | undefined,
): TieredPassportSnapshots {
  const snapshotAllFields = normalizeFieldValues(allFields);
  const snapshotPublicFields: FieldValueMap = {};
  const snapshotLegitimateInterestFields: FieldValueMap = {};
  const snapshotAuthoritiesOnlyFields: FieldValueMap = {};

  for (const [key, value] of Object.entries(snapshotAllFields)) {
    const def = BATTERY_FIELD_MAP[key];
    if (!def) continue;

    if (key === "additional_information" || def.tier === "legitimate_interest") {
      snapshotLegitimateInterestFields[key] = value;
    } else if (def.tier === "authorities_only") {
      snapshotAuthoritiesOnlyFields[key] = value;
    } else if (def.tier === "public") {
      snapshotPublicFields[key] = value;
    }
  }

  return {
    snapshotAllFields,
    snapshotPublicFields,
    snapshotLegitimateInterestFields,
    snapshotAuthoritiesOnlyFields,
  };
}

/** Determine visible public tabs for /p/[slug] without falling back to demo tabs or empty tabs. */
export function getVisiblePassportTabs(
  publicFields: Record<string, unknown> | null | undefined,
): RealPassportTabId[] {
  const clean = projectPublicPassportFields(publicFields);

  const hasGroupData = Object.keys(clean).some((key) => {
    const def = BATTERY_FIELD_MAP[key];
    return Boolean(def && def.subSection === "general");
  });

  const hasRepairData = Object.keys(clean).some((key) => {
    const def = BATTERY_FIELD_MAP[key];
    return Boolean(def && def.subSection === "repair");
  });

  const hasSupplyData = Object.keys(clean).some((key) => {
    const def = BATTERY_FIELD_MAP[key];
    return Boolean(def && def.subSection === "supply");
  });

  const tabs: RealPassportTabId[] = [];
  if (hasGroupData || Object.keys(clean).length > 0) {
    tabs.push("passport");
  }
  if (hasRepairData) {
    tabs.push("repair");
  }
  if (hasSupplyData) {
    tabs.push("supply");
  }
  // Provenance & recycling tab is always included for published records (carries notice + recycling fields).
  tabs.push("provenance");
  return tabs;
}

/** Group populated public fields into ordered UI sections cleanly. */
export function groupPublicFieldsForDisplay(
  publicFields: FieldValueMap,
  group: FieldGroupId,
): Array<{ field: BatteryFieldDefinition; value: string }> {
  return BATTERY_FIELDS.filter(
    (field) =>
      field.group === group &&
      field.tier === "public" &&
      Boolean(publicFields[field.key]),
  ).map((field) => ({
    field,
    value: publicFields[field.key],
  }));
}
