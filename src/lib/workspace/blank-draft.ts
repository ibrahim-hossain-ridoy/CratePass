import { z } from "zod";
import {
  STATIC_BATTERY_FIELDS,
  normalizeBatteryCategory,
  type BatteryCategory,
} from "../../config/battery-fields.ts";
import {
  normalizeFieldValues,
  sanitizeFieldValue,
} from "../passport-projection.ts";
import type { ExtractionResultMap } from "../../types/database.ts";

export const BLANK_DRAFT_AUDIT_ACTION = "blank_draft_created" as const;

export const BlankDraftRequestSchema = z
  .object({
    batteryCategory: z.enum(["LMT", "EV", "industrial"]).optional(),
    productName: z.string().max(160).optional(),
    modelCode: z.string().max(80).optional(),
  })
  .strict();

export interface BlankDraftInput {
  batteryCategory?: unknown;
  productName?: unknown;
  modelCode?: unknown;
}

export interface BlankDraftPayload {
  batteryCategory: BatteryCategory;
  productName: string;
  modelCode: string;
  workingFields: Record<string, string>;
  extraction: {
    fields: ExtractionResultMap;
    summary: {
      found: number;
      missing: number;
      uncertain: number;
      total: number;
    };
    usage: {
      mode: "manual";
      model: "manual_blank_draft";
      inputTokens: 0;
      outputTokens: 0;
    };
  };
  auditAction: typeof BLANK_DRAFT_AUDIT_ACTION;
  consumesExtractionCap: false;
  createsUploadRecord: false;
}

/**
 * Construct a deterministic blank passport draft payload with all static fields
 * initialized as `status: "missing"`, zero LLM calls, and zero extraction cap usage.
 */
export function buildBlankDraftPayload(
  rawInput: BlankDraftInput = {},
): BlankDraftPayload {
  const parsed = BlankDraftRequestSchema.parse({
    batteryCategory:
      typeof rawInput.batteryCategory === "string"
        ? normalizeBatteryCategory(rawInput.batteryCategory)
        : undefined,
    productName:
      typeof rawInput.productName === "string"
        ? rawInput.productName
        : undefined,
    modelCode:
      typeof rawInput.modelCode === "string" ? rawInput.modelCode : undefined,
  });

  const batteryCategory = normalizeBatteryCategory(parsed.batteryCategory);
  const cleanModelCode = sanitizeFieldValue(parsed.modelCode ?? "", 80);
  const cleanProductName =
    sanitizeFieldValue(parsed.productName ?? "", 160) ||
    cleanModelCode ||
    `Untitled ${batteryCategory} Battery Pack`;

  const fields: ExtractionResultMap = {};
  for (const def of STATIC_BATTERY_FIELDS) {
    fields[def.key] = {
      status: "missing",
      value: "",
      sourceSnippet: "",
    };
  }

  const workingFields = normalizeFieldValues({
    battery_category: batteryCategory,
    ...(cleanModelCode ? { model_serial_number: cleanModelCode } : {}),
  });

  return {
    batteryCategory,
    productName: cleanProductName,
    modelCode: cleanModelCode,
    workingFields,
    extraction: {
      fields,
      summary: {
        found: 0,
        missing: STATIC_BATTERY_FIELDS.length,
        uncertain: 0,
        total: STATIC_BATTERY_FIELDS.length,
      },
      usage: {
        mode: "manual",
        model: "manual_blank_draft",
        inputTokens: 0,
        outputTokens: 0,
      },
    },
    auditAction: BLANK_DRAFT_AUDIT_ACTION,
    consumesExtractionCap: false,
    createsUploadRecord: false,
  };
}
