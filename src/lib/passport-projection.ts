import {
  BATTERY_FIELDS,
  BATTERY_FIELD_MAP,
  type BatteryFieldDefinition,
  type FieldGroupId,
} from "../config/battery-fields.ts";

export type RealPassportTabId = "passport" | "repair" | "supply" | "provenance";

export type FieldValueMap = Record<string, string>;

const UNSAFE_URI_PATTERN = /^\s*(javascript|data|vbscript):/i;

/** Sanitize a single field string before persistence or rendering. */
export function sanitizeFieldValue(raw: unknown): string {
  if (raw === null || raw === undefined) return "";
  const str = String(raw).trim();
  if (!str) return "";
  if (UNSAFE_URI_PATTERN.test(str)) {
    return "";
  }
  return str.slice(0, 4000);
}

/** Keep only known keys from BATTERY_FIELDS and sanitize string values. */
export function normalizeFieldValues(
  raw: Record<string, unknown> | null | undefined,
): FieldValueMap {
  const clean: FieldValueMap = {};
  if (!raw || typeof raw !== "object") return clean;

  for (const field of BATTERY_FIELDS) {
    const val = sanitizeFieldValue(raw[field.key]);
    if (val) {
      clean[field.key] = val;
    }
  }
  return clean;
}

/**
 * Project a full passport field map down strictly to `tier === "public"` fields.
 * Never returns `restricted` or unknown keys.
 */
export function projectPublicPassportFields(
  allFields: Record<string, unknown> | null | undefined,
): FieldValueMap {
  const normalized = normalizeFieldValues(allFields);
  const publicOnly: FieldValueMap = {};

  for (const [key, value] of Object.entries(normalized)) {
    const def = BATTERY_FIELD_MAP[key];
    if (def && def.tier === "public") {
      publicOnly[key] = value;
    }
  }
  return publicOnly;
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
