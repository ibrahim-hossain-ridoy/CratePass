import type { Metadata } from "next";
import Link from "next/link";
import { LegalDocumentShell } from "@/components/legal/LegalDocumentShell";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: `Privacy & EU Data Processing (Draft) · ${siteConfig.siteName}`,
  description:
    "Draft GDPR and EU data-processing notice for Battery Passport Host (TODO: lawyer review).",
};

export default function PrivacyPage() {
  return (
    <LegalDocumentShell
      activePath="/privacy"
      title="Privacy & GDPR Notice (Draft)"
      subtitle="Describes EU GDPR processing roles, minimal session cookies, private PDF storage, zero default analytics, and customer export or erasure rights."
      lastUpdatedLabel="Status: Draft · Pending GDPR & DPA review"
    >
      <section className="space-y-2">
        <h2 className="text-[18px] font-semibold text-[var(--ink)]">
          1. GDPR Roles (B2B Controller &amp; Processor)
        </h2>
        <p className="text-[var(--muted)]">
          Battery brand organizations act as the Data Controller for technical
          specification PDFs and passport records uploaded to their workspace.{" "}
          {siteConfig.siteName} processes workspace account credentials, organization
          files, and published passport snapshots on the organization&rsquo;s documented
          instructions under EU GDPR principles.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-[18px] font-semibold text-[var(--ink)]">
          2. Data Collected &amp; Zero Tracking Analytics
        </h2>
        <p className="text-[var(--muted)]">
          This application sets strictly necessary authentication cookies only when
          signing into <code className="font-mono">/app</code> via Supabase Auth.{" "}
          <strong>
            No third-party analytics scripts, advertising pixels, or behavioral tracking
            cookies are enabled by default.
          </strong>{" "}
          Public readers visiting <code className="font-mono">/p/[slug]</code> or{" "}
          <code className="font-mono">/demo</code> do not require login or tracking
          cookies.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-[18px] font-semibold text-[var(--ink)]">
          3. Private PDF Storage &amp; LLM Sub-Processing Note
        </h2>
        <p className="text-[var(--muted)]">
          Uploaded specification PDFs are stored in a private storage bucket scoped by
          organization Row Level Security. Extracted plain text is treated strictly as
          untrusted structured data and, when an Anthropic API key is configured,
          submitted to the configured Anthropic model (<code className="font-mono">ANTHROPIC_MODEL</code>)
          solely to extract structured battery fields and log token usage. Do not upload
          unrelated personal data inside battery datasheets.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-[18px] font-semibold text-[var(--ink)]">
          4. Retention, Immutable Versions &amp; Erasure (GDPR Arts. 15–17)
        </h2>
        <p className="text-[var(--muted)]">
          Authenticated workspace members can export organization JSON records anytime
          from{" "}
          <Link
            href="/app/privacy"
            className="font-medium text-[var(--ink)] underline underline-offset-4"
          >
            /app/privacy
          </Link>{" "}
          and delete unpublished draft passports (including source PDFs) directly. Once a
          passport version is formally declared and published, immutable audit and
          snapshot records are retained for integrity traceability; you can unpublish{" "}
          <code className="font-mono">/p/[slug]</code> immediately from public view or
          email{" "}
          <a
            href={`mailto:${siteConfig.contactEmail}`}
            className="font-medium text-[var(--ink)] underline underline-offset-4"
          >
            {siteConfig.contactEmail}
          </a>{" "}
          for authenticated workspace closure and full database erasure review.
        </p>
      </section>
    </LegalDocumentShell>
  );
}
