import type { Metadata } from "next";
import { AuthSplitShell } from "@/components/auth/AuthSplitShell";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: `Sign in · ${siteConfig.siteName}`,
  description:
    "Sign in to your Battery Passport Host workspace to manage battery drafts, 71-point completeness checks, and hosted QR passports.",
};

export default function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  return <AuthSplitShell intent="signin" searchParamsPromise={searchParams} />;
}
