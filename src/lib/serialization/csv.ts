export type UnitLifecycleStatus = "active" | "repaired" | "repurposed" | "waste";

export interface ParsedUnitRow {
  serial_number: string;
  gtin: string | null;
  batch_lot: string | null;
  manufacturing_date: string | null;
}

export interface CsvRowValidationError {
  line: number;
  serial?: string;
  message: string;
}

export interface CsvParseResult {
  validRows: ParsedUnitRow[];
  errors: CsvRowValidationError[];
  duplicateSerials: string[];
}

export const UNITS_CSV_TEMPLATE =
  "serial_number,gtin,batch_lot,manufacturing_date\nSN-2026-00001,04012345678901,BATCH-2026-Q4,2026-11-15\nSN-2026-00002,04012345678901,BATCH-2026-Q4,2026-11-15\n";

const SERIAL_PATTERN = /^[A-Za-z0-9._-]{1,120}$/;
const GTIN_14_PATTERN = /^[0-9]{14}$/;
const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

/** Parse a single RFC-4180 CSV line supporting quoted cells and escaped quotes. */
function parseCsvLine(line: string): string[] {
  const cells: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (line[i + 1] === '"') {
          current += '"';
          i += 1;
        } else {
          inQuotes = false;
        }
      } else {
        current += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ",") {
      cells.push(current.trim());
      current = "";
    } else {
      current += ch;
    }
  }
  cells.push(current.trim());
  return cells;
}

function isValidIsoCalendarDate(value: string): boolean {
  if (!ISO_DATE_PATTERN.test(value)) return false;
  const [y, m, d] = value.split("-").map(Number);
  if (m < 1 || m > 12 || d < 1 || d > 31) return false;
  const date = new Date(Date.UTC(y, m - 1, d));
  return (
    date.getUTCFullYear() === y &&
    date.getUTCMonth() === m - 1 &&
    date.getUTCDate() === d
  );
}

/**
 * Parse and validate bulk serialized battery units CSV.
 * Required column: serial_number
 * Optional columns: gtin (14 digits), batch_lot, manufacturing_date (YYYY-MM-DD)
 */
export function parseSerializedUnitsCsv(
  rawCsv: string,
  existingSerials: readonly string[] = [],
  maxRows = 5000,
): CsvParseResult {
  const cleaned = rawCsv.replace(/^\uFEFF/, "").trim();
  if (!cleaned) {
    return {
      validRows: [],
      errors: [{ line: 1, message: "CSV file is empty." }],
      duplicateSerials: [],
    };
  }

  const lines = cleaned
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  if (lines.length < 2) {
    return {
      validRows: [],
      errors: [
        {
          line: 1,
          message:
            "CSV must include header row (serial_number,gtin,batch_lot,manufacturing_date) and at least one unit row.",
        },
      ],
      duplicateSerials: [],
    };
  }

  const headers = parseCsvLine(lines[0]).map((h) => h.toLowerCase().trim());
  const serialIdx = headers.indexOf("serial_number");
  const gtinIdx = headers.indexOf("gtin");
  const batchIdx = headers.indexOf("batch_lot");
  const mfgDateIdx = headers.indexOf("manufacturing_date");

  if (serialIdx === -1) {
    return {
      validRows: [],
      errors: [
        {
          line: 1,
          message: "Missing required column header 'serial_number'.",
        },
      ],
      duplicateSerials: [],
    };
  }

  const seenLower = new Set(existingSerials.map((s) => s.trim().toLowerCase()));
  const validRows: ParsedUnitRow[] = [];
  const errors: CsvRowValidationError[] = [];
  const duplicateSerials: string[] = [];

  const dataLines = lines.slice(1, 1 + maxRows);
  if (lines.length - 1 > maxRows) {
    errors.push({
      line: maxRows + 2,
      message: `CSV exceeds single-upload ceiling of ${maxRows} rows. Split into smaller batches.`,
    });
  }

  for (let i = 0; i < dataLines.length; i += 1) {
    const lineNum = i + 2;
    const cells = parseCsvLine(dataLines[i]);
    const serial = (cells[serialIdx] ?? "").trim();
    const gtinRaw = gtinIdx >= 0 ? (cells[gtinIdx] ?? "").trim() : "";
    const batchRaw = batchIdx >= 0 ? (cells[batchIdx] ?? "").trim() : "";
    const mfgDateRaw = mfgDateIdx >= 0 ? (cells[mfgDateIdx] ?? "").trim() : "";

    if (!serial) {
      errors.push({ line: lineNum, message: "Missing serial_number." });
      continue;
    }

    if (!SERIAL_PATTERN.test(serial)) {
      errors.push({
        line: lineNum,
        serial,
        message:
          "Invalid serial_number (use letters, digits, '.', '_', or '-' with no spaces).",
      });
      continue;
    }

    const lowerSerial = serial.toLowerCase();
    if (seenLower.has(lowerSerial)) {
      duplicateSerials.push(serial);
      errors.push({
        line: lineNum,
        serial,
        message: `Duplicate serial_number '${serial}'.`,
      });
      continue;
    }

    if (gtinRaw && !GTIN_14_PATTERN.test(gtinRaw)) {
      errors.push({
        line: lineNum,
        serial,
        message: `Invalid GTIN '${gtinRaw}' (must be exactly 14 numeric digits).`,
      });
      continue;
    }

    if (batchRaw.length > 120) {
      errors.push({
        line: lineNum,
        serial,
        message: "batch_lot exceeds 120 characters.",
      });
      continue;
    }

    if (mfgDateRaw && !isValidIsoCalendarDate(mfgDateRaw)) {
      errors.push({
        line: lineNum,
        serial,
        message: `Invalid manufacturing_date '${mfgDateRaw}' (expected YYYY-MM-DD).`,
      });
      continue;
    }

    seenLower.add(lowerSerial);
    validRows.push({
      serial_number: serial,
      gtin: gtinRaw || null,
      batch_lot: batchRaw || null,
      manufacturing_date: mfgDateRaw || null,
    });
  }

  return { validRows, errors, duplicateSerials };
}

/**
 * Build the public item-level QR target URL.
 * Uses GS1 Digital Link format `/01/[gtin]/21/[serial]` whenever a 14-digit GTIN is present;
 * otherwise falls back to `/p/[slug]/u/[serial]`.
 */
export function buildUnitPublicUrl({
  origin,
  slug,
  serialNumber,
  gtin,
}: {
  origin: string;
  slug: string;
  serialNumber: string;
  gtin?: string | null;
}): string {
  const cleanOrigin = origin.replace(/\/+$/, "");
  const cleanSerial = encodeURIComponent(serialNumber.trim());
  if (gtin && GTIN_14_PATTERN.test(gtin.trim())) {
    return `${cleanOrigin}/01/${gtin.trim()}/21/${cleanSerial}`;
  }
  return `${cleanOrigin}/p/${encodeURIComponent(slug)}/u/${cleanSerial}`;
}
