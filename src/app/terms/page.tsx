import type { Metadata } from "next";
import { LegalDocumentShell } from "@/components/legal/LegalDocumentShell";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: `Terms of Service (Draft) · ${siteConfig.siteName}`,
  description:
    "Draft Terms of Service for technical hosting infrastructure (TODO: lawyer review).",
};

export default function TermsPage() {
  return (
    <LegalDocumentShell
      activePath="/terms"
      title="Terms of Service (Draft)"
      subtitle="Governs brand access to upload battery specification PDFs, inspect completeness checks, and host mobile QR pages."
      lastUpdatedLabel="Draft · Pending legal review"
    >
      <section className="space-y-2">
        <h2 className="text-[18px] font-semibold text-[var(--ink)]">
          1. Scope of Technical Hosting Infrastructure
        </h2>
        <p className="text-[var(--muted)]">
          {siteConfig.siteName} (&ldquo;Operator&rdquo;) provides web software for
          uploading battery datasheet PDFs, extracting candidate fields into an editable
          completeness checklist, generating QR links, and serving customer-submitted
          data on hosted pages under <code className="font-mono">/p/[slug]</code>. The
          service does not issue regulatory conformity assessments, laboratory tests, or
          legal opinions.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-[18px] font-semibold text-[var(--ink)]">
          2. Manufacturer Responsibility &amp; Accuracy Declaration
        </h2>
        <p className="text-[var(--muted)]">
          Before publishing a passport version, an authorized organization user must
          review every extracted and manually entered value and accept the manufacturer
          declaration (&ldquo;I confirm this information is accurate and I am responsible
          for it&rdquo;). Each public passport explicitly informs readers that information
          was provided by the manufacturer and is not verified by us.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-[18px] font-semibold text-[var(--ink)]">
          3. Pilot Access, Usage Caps &amp; Billing
        </h2>
        <p className="text-[var(--muted)]">
          While pilot mode is active or when an organization carries an approved
          pilot grant, publishing is enabled free of charge subject to anti-abuse
          quotas (default 5 PDF extractions per organization per UTC day). When
          paid billing is enabled, subscription fees are listed at €
          {siteConfig.billingPlan.priceEurMonthly}/month and processed via Paddle,
          acting as Merchant of Record once configured.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-[18px] font-semibold text-[var(--ink)]">
          4. Acceptable Use &amp; Untrusted Uploads
        </h2>
        <p className="text-[var(--muted)]">
          Customers may upload only technical documentation they are authorized to
          process (PDF format, maximum 10 MB per upload). Attempting prompt injection,
          uploading malware, impersonating third-party brands, or bypassing tenant
          access controls is strictly prohibited and may result in account suspension.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-[18px] font-semibold text-[var(--ink)]">
          5. Draft Operator Contact
        </h2>
        <p className="text-[var(--muted)]">
          Questions or legal notices regarding this placeholder template may be sent to{" "}
          <a
            href={`mailto:${siteConfig.contactEmail}`}
            className="font-medium text-[var(--ink)] underline underline-offset-4"
          >
            {siteConfig.contactEmail}
          </a>
          .
        </p>
      </section>
    </LegalDocumentShell>
  );
}
