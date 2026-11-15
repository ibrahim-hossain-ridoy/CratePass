import QRCode from "qrcode";

export interface QrAssets {
  svg: string;
  pngDataUrl: string;
}

export function buildPublicPassportUrl(
  slug: string,
  runtimeOrigin?: string,
  configuredOverride?: string,
): string {
  const configured =
    configuredOverride?.trim() ||
    (typeof process !== "undefined" ? process.env.NEXT_PUBLIC_SITE_URL?.trim() : "");
  const origin =
    configured && !configured.includes("localhost")
      ? configured.replace(/\/+$/, "")
      : (runtimeOrigin || configured || "http://localhost:3000").replace(/\/+$/, "");

  return `${origin}/p/${encodeURIComponent(slug)}`;
}

export async function generateQrAssets(targetUrl: string): Promise<QrAssets> {
  const [svg, pngDataUrl] = await Promise.all([
    QRCode.toString(targetUrl, {
      type: "svg",
      width: 280,
      margin: 2,
      color: { dark: "#141413", light: "#FFFFFF" },
    }),
    QRCode.toDataURL(targetUrl, {
      width: 640,
      margin: 2,
      color: { dark: "#141413", light: "#FFFFFF" },
    }),
  ]);

  return { svg, pngDataUrl };
}
