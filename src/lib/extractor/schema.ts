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

export function validateAndNormalizeExtraction(
  raw: unknown,
): NormalizedExtractionOutput {
  const parsed = ExtractionPayloadSchema.safeParse(raw);
  if (!parsed.success) {
    throw new Error(
      `Invalid extraction payload: ${parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ")}`,
    );
  }

  const normalizedFields: ExtractionResultMap = {};
  let found = 0;
  let missing = 0;
  let uncertain = 0;

  for (const def of STATIC_BATTERY_FIELDS) {
    const candidate = parsed.data.fields[def.key];
    if (!candidate || candidate.status === "missing") {
      normalizedFields[def.key] = {
        status: "missing",
        value: "",
        sourceSnippet: "",
      };
      missing += 1;
      continue;
    }

    const maxChars = def.maxChars ?? 2000;
    const cleanVal = sanitizeFieldValue(candidate.value, maxChars);
    const cleanSnippet = sanitizeFieldValue(candidate.sourceSnippet, 260);

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

    const effectiveStatus =
      candidate.status === "uncertain" ? "uncertain" : "found";
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
    productName: sanitizeFieldValue(parsed.data.productName ?? "", 160),
    modelCode: sanitizeFieldValue(parsed.data.modelCode ?? "", 80),
    fields: normalizedFields,
    summary: {
      found,
      missing,
      uncertain,
      total: STATIC_BATTERY_FIELDS.length,
    },
  };
}
