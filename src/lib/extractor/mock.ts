import type { ExtractionResultMap } from "../../types/database.ts";
import { BATTERY_FIELDS } from "../../config/battery-fields.ts";
import {
  validateAndNormalizeExtraction,
  type NormalizedExtractionOutput,
} from "./schema.ts";

function findLineMatch(
  lines: string[],
  regex: RegExp,
  groupIndex = 1,
): { value: string; snippet: string } | null {
  for (const line of lines) {
    const match = line.match(regex);
    if (match && match[groupIndex]) {
      return {
        value: match[groupIndex].trim(),
        snippet: line.trim().slice(0, 180),
      };
    }
  }
  return null;
}

export function runMockDeterministicExtractor(
  untrustedText: string,
  fallbackFilename = "battery-spec.pdf",
): NormalizedExtractionOutput {
  const lines = untrustedText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  const fields: ExtractionResultMap = {};
  for (const def of BATTERY_FIELDS) {
    fields[def.key] = { status: "missing", value: "", sourceSnippet: "" };
  }

  const patterns: Array<{
    key: string;
    regex: RegExp;
    uncertain?: boolean;
  }> = [
    { key: "battery_model_name", regex: /(?:model|product(?:\s+name)?)\s*[:\-]\s*(.+)/i },
    { key: "model_code", regex: /(?:model\s*code|sku|part\s*(?:no|number))\s*[:\-]\s*([A-Z0-9._-]{3,})/i },
    { key: "manufacturer_name", regex: /(?:manufacturer)\s*[:\-]\s*(.+)/i },
    { key: "eu_responsible_person", regex: /(?:eu\s*(?:responsible|importer|representative))\s*[:\-]\s*(.+)/i },
    { key: "nominal_voltage_v", regex: /(?:nominal\s*voltage|voltage)\s*[:\-]?\s*(\d+(?:[.,]\d+)?)\s*v\b/i },
    { key: "rated_capacity_ah", regex: /(?:rated\s*capacity|capacity)\s*[:\-]?\s*(\d+(?:[.,]\d+)?)\s*ah\b/i },
    { key: "rated_energy_wh", regex: /(?:rated\s*energy|energy)\s*[:\-]?\s*(\d+(?:[.,]\d+)?)\s*wh\b/i },
    { key: "weight_kg", regex: /(?:weight|mass)\s*[:\-]?\s*(\d+(?:[.,]\d+)?)\s*kg\b/i },
    { key: "expected_cycle_life", regex: /(?:cycle\s*life|cycles)\s*[:\-]?\s*(\d{2,5})/i },
    { key: "enclosure_ip_rating", regex: /\b(ip[0-6][0-9k])\b/i },
    { key: "battery_chemistry", regex: /(?:chemistry|cell\s*type)\s*[:\-]\s*(.+)/i },
    {
      key: "carbon_footprint_kg_co2e",
      regex: /(?:carbon\s*footprint|co2e)\s*[:\-]?\s*(\d+(?:[.,]\d+)?)\s*(?:kg\s*co2e)?/i,
      uncertain: true,
    },
    { key: "safe_charging_window", regex: /(?:charg(?:e|ing)\s*(?:window|temp|temperature))\s*[:\-]\s*(.+)/i },
  ];

  for (const p of patterns) {
    const hit = findLineMatch(lines, p.regex, 1);
    if (hit) {
      fields[p.key] = {
        status: p.uncertain ? "uncertain" : "found",
        value: hit.value.replace(",", "."),
        sourceSnippet: hit.snippet,
      };
    }
  }

  // Heuristic fallback for manufacturer header line like "NordBike Energy GmbH"
  if (fields.manufacturer_name.status === "missing") {
    const companyLine = lines.find((l) =>
      /\b(GmbH|BV|AB|SARL|SAS|SpA|Ltd|LLC|Inc)\b/.test(l),
    );
    if (companyLine) {
      fields.manufacturer_name = {
        status: "uncertain",
        value: companyLine.slice(0, 100),
        sourceSnippet: companyLine.slice(0, 180),
      };
    }
  }

  const cleanFileProduct = fallbackFilename
    .replace(/\.pdf$/i, "")
    .replace(/[-_]+/g, " ")
    .trim();

  const productName =
    fields.battery_model_name.value || cleanFileProduct || "Uploaded Battery Pack";

  return validateAndNormalizeExtraction({
    productName,
    modelCode: fields.model_code.value || "",
    fields,
  });
}
