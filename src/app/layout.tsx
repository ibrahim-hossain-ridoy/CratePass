import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, IBM_Plex_Sans, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";

const bricolage = Bricolage_Grotesque({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-display",
  display: "swap",
});

const ibmPlexSans = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-sans-ui",
  display: "swap",
});

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-mono-code",
  display: "swap",
});

const configuredSiteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();
const safeMetadataBase =
  configuredSiteUrl && /^https?:\/\//i.test(configuredSiteUrl)
    ? new URL(configuredSiteUrl)
    : undefined;

export const metadata: Metadata = {
  metadataBase: safeMetadataBase,
  title: "Battery Passport Host — EU Battery Passport from Spec PDFs",
  description:
    "Turn battery spec PDFs into structured EU Digital Product Passports, 71-point Annex XIII completeness checks, and hosted mobile QR passport links.",
  openGraph: {
    title: "Battery Passport Host — EU Battery Passport from Spec PDFs",
    description:
      "Turn battery spec PDFs into structured EU Digital Product Passports, 71-point Annex XIII completeness checks, and hosted mobile QR passport links.",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#e8e7e3",
  colorScheme: "light",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${bricolage.variable} ${ibmPlexSans.variable} ${ibmPlexMono.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-[var(--ground)] text-[var(--ink)] font-sans selection:bg-[#145b6e]/18 selection:text-[#0f1114]">
        {children}
      </body>
    </html>
  );
}
