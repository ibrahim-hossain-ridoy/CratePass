import type { ExtractionResultMap } from "../../types/database.ts";
import { STATIC_BATTERY_FIELDS } from "../../config/battery-fields.ts";
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
  for (const def of STATIC_BATTERY_FIELDS) {
    fields[def.key] = { status: "missing", value: "", sourceSnippet: "" };
  }

  const matchedSnippets = new Set<string>();

  const patterns: Array<{
    key: string;
    regex: RegExp;
    uncertain?: boolean;
  }> = [
    {
      key: "unique_identifier",
      regex: /(?:unique\s*id(?:entifier)?|passport\s*id|uri)\s*[:\-]\s*(\S+)/i,
    },
    {
      key: "registering_entity_identity",
      regex: /(?:registering\s*entity|eu\s*(?:responsible|importer|representative))\s*[:\-]\s*(.+)/i,
    },
    {
      key: "manufacturer_name",
      regex: /(?:manufacturer)\s*[:\-]\s*(.+)/i,
    },
    {
      key: "manufacturer_postal_address",
      regex: /(?:manufacturer\s*address|postal\s*address|address)\s*[:\-]\s*(.+)/i,
    },
    {
      key: "manufacturer_contact_digital",
      regex: /(?:web(?:site)?|email|contact)\s*[:\-]\s*(\S+@\S+|https?:\/\/\S+)/i,
    },
    {
      key: "battery_category",
      regex: /(?:battery\s*category|category)\s*[:\-]\s*(LMT|EV|industrial)/i,
    },
    {
      key: "model_serial_number",
      regex: /(?:model(?:\s*code)?|sku|serial(?:\s*number)?|batch)\s*[:\-]\s*(.+)/i,
    },
    {
      key: "place_of_manufacture",
      regex: /(?:place\s*of\s*manufacture|manufacturing\s*(?:plant|site|location))\s*[:\-]\s*(.+)/i,
    },
    {
      key: "date_of_manufacturing",
      regex: /(?:date\s*of\s*manufactur(?:e|ing)|manufactured)\s*[:\-]\s*(\d{4}(?:-\d{2})?)/i,
    },
    {
      key: "weight_kg",
      regex: /(?:weight|mass)\s*[:\-]?\s*(\d+(?:[.,]\d+)?)\s*kg\b/i,
    },
    {
      key: "capacity_ah",
      regex: /(?:rated\s*capacity|capacity)\s*[:\-]?\s*(\d+(?:[.,]\d+)?)\s*ah\b/i,
    },
    {
      key: "chemistry_type",
      regex: /(?:chemistry|cell\s*type)\s*[:\-]\s*(.+)/i,
    },
    {
      key: "extinguishing_agent",
      regex: /(?:extinguishing\s*agent|fire\s*extinguish(?:er|ing))\s*[:\-]\s*(.+)/i,
    },
    {
      key: "critical_raw_materials",
      regex: /(?:critical\s*raw\s*materials)\s*[:\-]\s*(.+)/i,
    },
    {
      key: "minimal_voltage_v",
      regex: /(?:min(?:imal|imum)\s*voltage|cut[\-\s]*off\s*voltage)\s*[:\-]?\s*(\d+(?:[.,]\d+)?)\s*v\b/i,
    },
    {
      key: "nominal_voltage_v",
      regex: /(?:nominal\s*voltage|voltage)\s*[:\-]?\s*(\d+(?:[.,]\d+)?)\s*v\b/i,
    },
    {
      key: "maximum_voltage_v",
      regex: /(?:max(?:imum)?\s*voltage|charge\s*voltage)\s*[:\-]?\s*(\d+(?:[.,]\d+)?)\s*v\b/i,
    },
    {
      key: "original_power_w",
      regex: /(?:original\s*power|rated\s*power|continuous\s*power)\s*[:\-]?\s*(\d+(?:[.,]\d+)?)\s*w\b/i,
    },
    {
      key: "expected_lifetime_cycles",
      regex: /(?:cycle\s*life|expected\s*lifetime|cycles)\s*[:\-]?\s*(\d{2,5})/i,
    },
    {
      key: "temperature_range_c",
      regex: /(?:temperature\s*range|operating\s*temp(?:erature)?)\s*[:\-]\s*(.+)/i,
    },
    {
      key: "internal_resistance_ohms",
      regex: /(?:internal\s*resistance|pack\s*resistance)\s*[:\-]?\s*(\d+(?:[.,]\d+)?\s*(?:m?Ω|mohm|ohm))/i,
    },
    {
      key: "charge_c_rate",
      regex: /(?:charge\s*c[\-\s]*rate)\s*[:\-]?\s*(\d+(?:[.,]\d+)?)\s*c?\b/i,
    },
    {
      key: "discharge_c_rate",
      regex: /(?:discharge\s*c[\-\s]*rate)\s*[:\-]?\s*(\d+(?:[.,]\d+)?)\s*c?\b/i,
    },
  ];

  for (const p of patterns) {
    const hit = findLineMatch(lines, p.regex, 1);
    if (hit) {
      fields[p.key] = {
        status: p.uncertain ? "uncertain" : "found",
        value: hit.value.replace(",", "."),
        sourceSnippet: hit.snippet,
      };
      matchedSnippets.add(hit.snippet);
    }
  }

  // Heuristic fallback for manufacturer header line like "NordBike Energy GmbH"
  if (fields.manufacturer_name.status === "missing") {
    const companyLine = lines.find((l) =>
      /\b(GmbH|BV|AB|SARL|SAS|SpA|Ltd|LLC|Inc)\b/.test(l),
    );
    if (companyLine) {
      const snippet = companyLine.slice(0, 180);
      fields.manufacturer_name = {
        status: "uncertain",
        value: companyLine.slice(0, 100),
        sourceSnippet: snippet,
      };
      matchedSnippets.add(snippet);
    }
  }

  // Map remaining technical spec lines (e.g. energy in Wh, IP rating, enclosure notes) into additional_information
  const unmappedTechLines = lines.filter(
    (l) =>
      !matchedSnippets.has(l.slice(0, 180)) &&
      !/(?:ignore\s+previous\s+instructions|<\/?untrusted_datasheet_text>)/i.test(l) &&
      /(?:\b\d+\s*(?:wh|kwh|a|mm)\b|\bip\d{2}\b|enclosure|housing|connector|cell\s*format|bms|balancing)/i.test(
        l,
      ),
  );
  if (unmappedTechLines.length > 0) {
    const combined = unmappedTechLines.slice(0, 5).join("; ").slice(0, 2000);
    fields.additional_information = {
      status: "found",
      value: combined,
      sourceSnippet: unmappedTechLines[0].slice(0, 180),
    };
  }

  const cleanFileProduct = fallbackFilename
    .replace(/\.pdf$/i, "")
    .replace(/[-_]+/g, " ")
    .trim();

  const productName =
    fields.model_serial_number.value ||
    cleanFileProduct ||
    "Uploaded Battery Pack";

  return validateAndNormalizeExtraction({
    productName,
    modelCode: fields.model_serial_number.value || "",
    fields,
  });
}
