export const MAX_BRAND_LOGO_BYTES = 2 * 1024 * 1024;

export const ALLOWED_LOGO_MIMES: Readonly<Record<string, string>> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "image/svg+xml": "svg",
};

const DANGEROUS_SVG_PATTERNS: readonly RegExp[] = [
  /<script\b/i,
  /<foreignobject\b/i,
  /<iframe\b/i,
  /<object\b/i,
  /<embed\b/i,
  /<!entity\b/i,
  /\bon[a-z]+\s*=/i,
  /javascript\s*:/i,
  /vbscript\s*:/i,
  /data\s*:\s*text\/html/i,
];

function startsWithBytes(bytes: Uint8Array, sig: readonly number[]): boolean {
  if (bytes.byteLength < sig.length) return false;
  for (let i = 0; i < sig.length; i++) {
    if (bytes[i] !== sig[i]) return false;
  }
  return true;
}

/**
 * Validate an uploaded workspace brand logo against declared MIME type,
 * actual binary magic bytes (PNG/JPEG/WebP), and strict anti-XSS rules for SVG.
 */
export function validateBrandLogoUpload(params: {
  bytes: Uint8Array;
  mimeType: string;
}): { ext: string; normalizedMime: string } {
  const { bytes, mimeType } = params;
  const normalizedMime = mimeType.trim().toLowerCase();
  const ext = ALLOWED_LOGO_MIMES[normalizedMime];
  if (!ext) {
    throw new Error("Supported logo formats: PNG, JPEG, WebP, or SVG.");
  }

  if (!bytes || bytes.byteLength === 0 || bytes.byteLength > MAX_BRAND_LOGO_BYTES) {
    throw new Error("Brand logo must be between 1 byte and 2 MB.");
  }

  if (normalizedMime === "image/png") {
    if (!startsWithBytes(bytes, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) {
      throw new Error("Invalid PNG file signature.");
    }
    return { ext, normalizedMime };
  }

  if (normalizedMime === "image/jpeg") {
    if (!startsWithBytes(bytes, [0xff, 0xd8, 0xff])) {
      throw new Error("Invalid JPEG file signature.");
    }
    return { ext, normalizedMime };
  }

  if (normalizedMime === "image/webp") {
    const riff = startsWithBytes(bytes, [0x52, 0x49, 0x46, 0x46]); // RIFF
    const webp =
      bytes.byteLength >= 12 &&
      bytes[8] === 0x57 &&
      bytes[9] === 0x45 &&
      bytes[10] === 0x42 &&
      bytes[11] === 0x50; // WEBP
    if (!riff || !webp) {
      throw new Error("Invalid WebP file signature.");
    }
    return { ext, normalizedMime };
  }

  // image/svg+xml: reject active script / event-handler / XXE payloads
  const svgText = Buffer.from(bytes).toString("utf8").replace(/^\uFEFF/, "").trim();
  if (!/<svg\b/i.test(svgText)) {
    throw new Error("Invalid SVG document: missing <svg> root element.");
  }
  for (const pattern of DANGEROUS_SVG_PATTERNS) {
    if (pattern.test(svgText)) {
      throw new Error(
        "SVG logo rejected because it contains active scripts or unsafe markup.",
      );
    }
  }

  return { ext, normalizedMime };
}
