import { z } from "zod";
import { BATTERY_FIELDS, BATTERY_FIELD_MAP } from "../../config/battery-fields.ts";
import { sanitizeFieldValue } from "../passport-projection.ts";
import type { ExtractionResultMap } from "../../types/database.ts";

export const ExtractedFieldSchema = z.object({
  status: z.enum(["found", "missing", "uncertain"]),
  value: z.string().max(2000),
  sourceSnippet: z.string().max(300),
});

export const ExtractionPayloadSchema = z.object({
  productName: z.string().max(160).optional(),
  modelCode: z.string().max(80).optional(),
  fields: z.record(z.string(), ExtractedFieldSchema),
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
      `Invalid extraction payload: ${parsed.error.issues.map((i) => i.message).join("; ")}`,
    );
  }

  const normalizedFields: ExtractionResultMap = {};
  let found = 0;
  let missing = 0;
  let uncertain = 0;

  for (const def of BATTERY_FIELDS) {
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

    const cleanVal = sanitizeFieldValue(candidate.value);
    const cleanSnippet = sanitizeFieldValue(candidate.sourceSnippet).slice(0, 260);
    if (!cleanVal) {
      normalizedFields[def.key] = {
        status: "missing",
        value: "",
        sourceSnippet: "",
      };
      missing += 1;
      continue;
    }

    const effectiveStatus = candidate.status === "uncertain" ? "uncertain" : "found";
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

  // Defensive check against invalid keys slipping into UI
  for (const key of Object.keys(normalizedFields)) {
    if (!BATTERY_FIELD_MAP[key]) {
      delete normalizedFields[key];
    }
  }

  return {
    productName: sanitizeFieldValue(parsed.data.productName ?? ""),
    modelCode: sanitizeFieldValue(parsed.data.modelCode ?? ""),
    fields: normalizedFields,
    summary: {
      found,
      missing,
      uncertain,
      total: BATTERY_FIELDS.length,
    },
  };
}
