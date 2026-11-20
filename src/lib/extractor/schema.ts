import { z } from "zod";
import {
  STATIC_BATTERY_FIELDS,
  DYNAMIC_BMS_FIELDS,
} from "../../config/battery-fields.ts";
import { sanitizeFieldValue } from "../passport-projection.ts";
import type { ExtractionResultMap } from "../../types/database.ts";

export const STATIC_EXTRACTION_KEYS = new Set(
  STATIC_BATTERY_FIELDS.map((f) => f.key),
);

export const DYNAMIC_BMS_KEYS = new Set(
  DYNAMIC_BMS_FIELDS.map((f) => f.key),
);

export const ExtractedFieldSchema = z
  .object({
    status: z.enum(["found", "missing", "uncertain"]),
    value: z.string().max(2000).nullable().optional().default(""),
    sourceSnippet: z.string().max(300).nullable().optional(),
    source_snippet: z.string().max(300).nullable().optional(),
  })
  .transform((item) => ({
    status: item.status,
    value: item.value ?? "",
    sourceSnippet: item.sourceSnippet ?? item.source_snippet ?? "",
  }));

// Build strict static-only Zod schema (Points 1–50 + additional_information).
// Dynamic BMS telemetry fields (Points 51–71) are excluded from the schema so
// any dynamic key in raw extractor output fails strict schema validation.
const staticFieldShape: Record<string, z.ZodOptional<typeof ExtractedFieldSchema>> =
  Object.fromEntries(
    STATIC_BATTERY_FIELDS.map((f) => [f.key, ExtractedFieldSchema.optional()]),
  );

export const StaticExtractionFieldsSchema = z.object(staticFieldShape).strict();

export const ExtractionPayloadSchema = z.object({
  productName: z.string().max(160).optional(),
  modelCode: z.string().max(80).optional(),
  fields: StaticExtractionFieldsSchema,
});

export type ValidatedExtractionPayload = z.infer<typeof ExtractionPayloadSchema>;

export interface ExtractionSummaryCounts {
  found: number;
  missing: number;
  uncertain: number;
  total: number;
}

export interface NormalizedExtractionOutput {
  productName: string;
  modelCode: string;
  fields: ExtractionResultMap;
  summary: ExtractionSummaryCounts;
}

export interface ValidateExtractionOptions {
  /**
   * When true (default), dynamic BMS keys (Points 51–71) throw an error.
   * When false, dynamic keys are silently ignored and excluded from output.
   */
  rejectDynamicKeys?: boolean;
}

function coercePrimitiveToString(value: unknown): string {
  if (typeof value === "string") return value;
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  if (typeof value === "boolean") return String(value);
  return "";
}

export function validateAndNormalizeExtraction(
  raw: unknown,
  options?: ValidateExtractionOptions,
): NormalizedExtractionOutput {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    throw new Error("Invalid extraction payload: expected top-level JSON object.");
  }

  const rawObj = raw as Record<string, unknown>;
  const rawFieldsCandidate = rawObj.fields;
  if (
    !rawFieldsCandidate ||
    typeof rawFieldsCandidate !== "object" ||
    Array.isArray(rawFieldsCandidate)
  ) {
    throw new Error("Invalid extraction payload: missing 'fields' object.");
  }

  const rawFields = rawFieldsCandidate as Record<string, unknown>;
  const rejectDynamicKeys = options?.rejectDynamicKeys !== false;

  if (rejectDynamicKeys) {
    const offendingDynamicKeys = Object.keys(rawFields).filter((key) =>
      DYNAMIC_BMS_KEYS.has(key),
    );
    if (offendingDynamicKeys.length > 0) {
      throw new Error(
        `Invalid extraction payload: fields: Unrecognized key(s) in object: ${offendingDynamicKeys.map((k) => `'${k}'`).join(", ")}`,
      );
    }
  }

  const normalizedFields: ExtractionResultMap = {};
  let found = 0;
  let missing = 0;
  let uncertain = 0;

  for (const def of STATIC_BATTERY_FIELDS) {
    const rawCandidate = rawFields[def.key];
    if (
      !rawCandidate ||
      typeof rawCandidate !== "object" ||
      Array.isArray(rawCandidate)
    ) {
      normalizedFields[def.key] = {
        status: "missing",
        value: "",
        sourceSnippet: "",
      };
      missing += 1;
      continue;
    }

    const entry = rawCandidate as Record<string, unknown>;
    const rawStatus =
      typeof entry.status === "string" ? entry.status.trim().toLowerCase() : "";

    if (rawStatus !== "found" && rawStatus !== "uncertain") {
      normalizedFields[def.key] = {
        status: "missing",
        value: "",
        sourceSnippet: "",
      };
      missing += 1;
      continue;
    }

    const maxChars = def.maxChars ?? 2000;
    const rawValue = coercePrimitiveToString(entry.value);
    const rawSnippet = coercePrimitiveToString(
      entry.sourceSnippet ?? entry.source_snippet,
    );
    const cleanVal = sanitizeFieldValue(rawValue, maxChars);
    const cleanSnippet = sanitizeFieldValue(rawSnippet, 260);

    // Anti-hallucination guardrail: every "found" or "uncertain" field MUST carry
    // both a non-empty value AND a verbatim sourceSnippet from the PDF.
    if (!cleanVal || !cleanSnippet) {
      normalizedFields[def.key] = {
        status: "missing",
        value: "",
        sourceSnippet: "",
      };
      missing += 1;
      continue;
    }

    const effectiveStatus = rawStatus === "uncertain" ? "uncertain" : "found";
    normalizedFields[def.key] = {
      status: effectiveStatus,
      value: cleanVal,
      sourceSnippet: cleanSnippet,
    };

    if (effectiveStatus === "found") {
      found += 1;
    } else {
      uncertain += 1;
    }
  }

  return {
    productName: sanitizeFieldValue(
      coercePrimitiveToString(rawObj.productName),
      160,
    ),
    modelCode: sanitizeFieldValue(
      coercePrimitiveToString(rawObj.modelCode),
      80,
    ),
    fields: normalizedFields,
    summary: {
      found,
      missing,
      uncertain,
      total: STATIC_BATTERY_FIELDS.length,
    },
  };
}
