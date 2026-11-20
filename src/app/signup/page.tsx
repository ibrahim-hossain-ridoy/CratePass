import type { Metadata } from "next";
import { AuthSplitShell } from "@/components/auth/AuthSplitShell";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: `Sign up · ${siteConfig.siteName}`,
  description:
    "Create your free Battery Passport Host workspace to upload OEM battery specification PDFs and run 71-point Annex XIII completeness checks.",
};

export default function SignUpPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  return <AuthSplitShell intent="signup" searchParamsPromise={searchParams} />;
}
