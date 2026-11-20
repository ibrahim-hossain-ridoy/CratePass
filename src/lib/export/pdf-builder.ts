import QRCode from "qrcode";

const A4_WIDTH = 595.28;
const A4_HEIGHT = 841.89;

/** Escape text for PDF literal string parentheses using WinAnsi/ASCII-safe printable range. */
export function pdfEscapeText(input: string): string {
  const asciiSafe = input
    .replace(/[\u2013\u2014]/g, "-")
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/\u20AC/g, "EUR ")
    .replace(/\u00B0/g, " deg ")
    .replace(/\u2264/g, "<=")
    .replace(/\u2265/g, ">=")
    .replace(/\u00B7/g, " | ")
    .replace(/[^\x20-\x7E]/g, " ");

  return asciiSafe
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)");
}

export function truncatePdfText(input: string, maxLen: number): string {
  const clean = input.trim();
  if (clean.length <= maxLen) return clean;
  return `${clean.slice(0, Math.max(1, maxLen - 3))}...`;
}

/**
 * Assemble a valid multi-page PDF 1.4 document from raw page content streams.
 * Uses standard Type1 Helvetica (/F1) and Helvetica-Bold (/F2) fonts (zero external font embedding needed).
 */
export function buildMultiPagePdf(pageStreams: readonly string[]): Uint8Array {
  const safePages = pageStreams.length > 0 ? pageStreams : ["BT /F1 11 Tf 40 780 Td (Empty document) Tj ET"];

  // Object layout:
  // 1: Catalog
  // 2: Pages
  // 3: Font /F1 Helvetica
  // 4: Font /F2 Helvetica-Bold
  // Then for each page i: (5 + i*2) = Page object, (6 + i*2) = Content stream
  const objects: string[] = [];

  const pageObjectIds: number[] = [];
  for (let i = 0; i < safePages.length; i += 1) {
    pageObjectIds.push(5 + i * 2);
  }

  objects.push("1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n");
  objects.push(
    `2 0 obj\n<< /Type /Pages /Count ${safePages.length} /Kids [${pageObjectIds.map((id) => `${id} 0 R`).join(" ")}] >>\nendobj\n`,
  );
  objects.push(
    "3 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n",
  );
  objects.push(
    "4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>\nendobj\n",
  );

  for (let i = 0; i < safePages.length; i += 1) {
    const pageObjId = 5 + i * 2;
    const contentObjId = 6 + i * 2;
    const stream = safePages[i];
    const byteLen = Buffer.byteLength(stream, "latin1");

    objects.push(
      `${pageObjId} 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${A4_WIDTH.toFixed(2)} ${A4_HEIGHT.toFixed(2)}] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents ${contentObjId} 0 R >>\nendobj\n`,
    );
    objects.push(
      `${contentObjId} 0 obj\n<< /Length ${byteLen} >>\nstream\n${stream}\nendstream\nendobj\n`,
    );
  }

  const header = "%PDF-1.4\n%\xE2\xE3\xCF\xD3\n";
  const parts: Buffer[] = [Buffer.from(header, "latin1")];
  const offsets: number[] = [0];
  let currentOffset = parts[0].length;

  for (const obj of objects) {
    offsets.push(currentOffset);
    const buf = Buffer.from(obj, "latin1");
    parts.push(buf);
    currentOffset += buf.length;
  }

  const xrefOffset = currentOffset;
  let xref = `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (let i = 1; i <= objects.length; i += 1) {
    xref += `${String(offsets[i]).padStart(10, "0")} 00000 n \n`;
  }
  const trailer = `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`;

  parts.push(Buffer.from(xref + trailer, "latin1"));
  return new Uint8Array(Buffer.concat(parts));
}

/** Generate PDF vector path commands drawing a crisp QR matrix at (x, y) bottom-left with total side length `sizePt`. */
function renderQrVectorOps(url: string, x: number, y: number, sizePt: number): string {
  const qr = QRCode.create(url, { errorCorrectionLevel: "M" });
  const modules = qr.modules;
  const count = modules.size;
  const quiet = 2;
  const totalModules = count + quiet * 2;
  const cell = sizePt / totalModules;

  const ops: string[] = [];
  // White quiet-zone background
  ops.push("1 1 1 rg");
  ops.push(`${x.toFixed(2)} ${y.toFixed(2)} ${sizePt.toFixed(2)} ${sizePt.toFixed(2)} re f`);
  // Matte charcoal QR modules
  ops.push("0.06 0.07 0.08 rg");

  for (let row = 0; row < count; row += 1) {
    for (let col = 0; col < count; col += 1) {
      if (modules.get(row, col)) {
        const mx = x + (col + quiet) * cell;
        const my = y + (totalModules - 1 - (row + quiet)) * cell;
        ops.push(
          `${mx.toFixed(2)} ${my.toFixed(2)} ${(cell + 0.08).toFixed(2)} ${(cell + 0.08).toFixed(2)} re f`,
        );
      }
    }
  }
  return ops.join("\n");
}

export interface QrLabelItem {
  serialNumber: string;
  modelName: string;
  gtin?: string | null;
  batchLot?: string | null;
  url: string;
}

/**
 * Generate a print-ready A4 multi-label PDF sheet (3 columns x 5 rows = 15 labels/page)
 * with crisp vector QR codes, Serial Number, Model Name, and GS1/URL caption below each QR.
 */
export function buildQrLabelSheetPdf({
  modelName,
  slug,
  labels,
}: {
  modelName: string;
  slug: string;
  labels: readonly QrLabelItem[];
}): Uint8Array {
  const cols = 3;
  const rows = 5;
  const perPage = cols * rows;
  const marginX = 32;
  const topHeaderHeight = 52;
  const bottomFooterHeight = 36;
  const gapX = 12;
  const gapY = 10;

  const cellW = (A4_WIDTH - marginX * 2 - gapX * (cols - 1)) / cols;
  const cellH =
    (A4_HEIGHT - topHeaderHeight - bottomFooterHeight - gapY * (rows - 1) - 16) /
    rows;
  const qrSize = Math.min(cellW - 28, cellH - 54, 90);

  const pageStreams: string[] = [];
  const totalPages = Math.max(1, Math.ceil(labels.length / perPage));

  for (let p = 0; p < totalPages; p += 1) {
    const slice = labels.slice(p * perPage, (p + 1) * perPage);
    const ops: string[] = [];

    // Page Header
    ops.push("0.06 0.07 0.08 rg");
    ops.push(
      `BT /F2 12 Tf ${marginX} ${(A4_HEIGHT - 28).toFixed(2)} Td (${pdfEscapeText(
        `CratePass Serialized QR Label Sheet - ${truncatePdfText(modelName, 44)}`,
      )}) Tj ET`,
    );
    ops.push("0.32 0.34 0.37 rg");
    ops.push(
      `BT /F1 8.5 Tf ${marginX} ${(A4_HEIGHT - 42).toFixed(2)} Td (${pdfEscapeText(
        `Model route: /p/${slug}  |  Units: ${labels.length}  |  Page ${p + 1} of ${totalPages}`,
      )}) Tj ET`,
    );

    // Draw each label card in 3x5 A4 grid
    slice.forEach((item, idx) => {
      const col = idx % cols;
      const row = Math.floor(idx / cols);
      const bx = marginX + col * (cellW + gapX);
      const by =
        A4_HEIGHT - topHeaderHeight - 10 - (row + 1) * cellH - row * gapY;

      // Subtle cut border
      ops.push("0.82 0.82 0.80 RG 0.6 w");
      ops.push(`${bx.toFixed(2)} ${by.toFixed(2)} ${cellW.toFixed(2)} ${cellH.toFixed(2)} re S`);

      // Vector QR centered near top of cell
      const qrX = bx + (cellW - qrSize) / 2;
      const qrY = by + cellH - qrSize - 8;
      ops.push(renderQrVectorOps(item.url, qrX, qrY, qrSize));

      // Human-readable Serial Number
      ops.push("0.06 0.07 0.08 rg");
      ops.push(
        `BT /F2 8.5 Tf ${(bx + 8).toFixed(2)} ${(qrY - 12).toFixed(2)} Td (${pdfEscapeText(
          `SN: ${truncatePdfText(item.serialNumber, 24)}`,
        )}) Tj ET`,
      );

      // Model name & optional batch
      ops.push("0.22 0.24 0.27 rg");
      ops.push(
        `BT /F1 7.5 Tf ${(bx + 8).toFixed(2)} ${(qrY - 22).toFixed(2)} Td (${pdfEscapeText(
          truncatePdfText(
            item.batchLot ? `${item.modelName} | ${item.batchLot}` : item.modelName,
            29,
          ),
        )}) Tj ET`,
      );

      // GS1 or URL caption
      const caption = item.gtin
        ? `GS1 (01)${item.gtin}(21)${truncatePdfText(item.serialNumber, 14)}`
        : truncatePdfText(item.url.replace(/^https?:\/\//i, ""), 34);
      ops.push("0.08 0.36 0.43 rg");
      ops.push(
        `BT /F1 6.5 Tf ${(bx + 8).toFixed(2)} ${(qrY - 32).toFixed(2)} Td (${pdfEscapeText(caption)}) Tj ET`,
      );
    });

    // Footer disclaimer
    ops.push("0.38 0.40 0.43 rg");
    ops.push(
      `BT /F1 7.5 Tf ${marginX} 18 Td (${pdfEscapeText(
        "Declared by economic operator using CratePass technical hosting; not verified by CratePass. Working field list - check against official regulation.",
      )}) Tj ET`,
    );

    pageStreams.push(ops.join("\n"));
  }

  return buildMultiPagePdf(pageStreams);
}
