import type { Metadata } from "next";
import Link from "next/link";
import { LegalDocumentShell } from "@/components/legal/LegalDocumentShell";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: `Privacy Policy · ${siteConfig.siteName}`,
  description:
    "Privacy Policy for CratePass covering account data, battery specification PDFs, subprocessors (Supabase, Vercel, Google Gemini/Anthropic, Paddle), EU GDPR alignment, and deletion rights.",
};

export default function PrivacyPage() {
  return (
    <LegalDocumentShell
      activePath="/privacy"
      title="Privacy Policy"
      subtitle="Explains what account, technical product, PDF, and telemetry data CratePass processes, which subprocessors we use, and how you can export or delete your records."
    >
      <section className="space-y-2.5">
        <h2 className="text-[18px] font-semibold text-[#0f1114]">
          1. Operator Identity, Scope &amp; EU GDPR Alignment
        </h2>
        <p className="text-[#4b4f57]">
          {siteConfig.siteName} is a business-to-business (B2B) Digital Product
          Passport hosting and completeness-check service operated by{" "}
          <strong className="font-semibold text-[#0f1114]">
            {siteConfig.legal.operatorName}
          </strong>{" "}
          ({siteConfig.legal.registeredAddress}). For customer workspaces, the
          battery manufacturer, importer, or authorized business organization
          acts as the Data Controller for uploaded technical files and declared
          passport content, while {siteConfig.siteName} acts as a technical
          processor following the customer&rsquo;s documented instructions.
        </p>
        <p className="text-[#4b4f57]">
          While {siteConfig.siteName} is operated under the laws of{" "}
          {siteConfig.legal.governingLaw}, our B2B data handling is aligned to
          EU GDPR principles. A formal Data Processing Addendum (DPA) and
          information regarding EU Article 27 representation are available on
          request via{" "}
          <a
            href={`mailto:${siteConfig.legal.contactEmail}`}
            className="font-medium text-[#145b6e] underline underline-offset-4"
          >
            {siteConfig.legal.contactEmail}
          </a>
          .
        </p>
      </section>

      <section className="space-y-2.5">
        <h2 className="text-[18px] font-semibold text-[#0f1114]">
          2. Account Data &amp; Essential Cookies Only
        </h2>
        <p className="text-[#4b4f57]">
          When you create or sign into a workspace under{" "}
          <code className="font-mono text-[#0f1114]">/app</code>, we process
          your work email address, authentication tokens and password hashes
          (managed via Supabase Auth), organization name, and workspace role
          metadata.
        </p>
        <p className="text-[#4b4f57]">
          {siteConfig.siteName} sets strictly necessary authentication and
          session cookies only when signed in.{" "}
          <strong className="font-semibold text-[#0f1114]">
            We do not load advertising pixels, third-party ad trackers, or
            behavioral analytics scripts.
          </strong>{" "}
          Public visitors reading{" "}
          <code className="font-mono text-[#0f1114]">/p/[slug]</code>,{" "}
          <code className="font-mono text-[#0f1114]">/checker</code>,{" "}
          <code className="font-mono text-[#0f1114]">/pricing</code>, or{" "}
          <code className="font-mono text-[#0f1114]">/demo</code> require no
          account and receive no tracking cookies.
        </p>
      </section>

      <section className="space-y-2.5">
        <h2 className="text-[18px] font-semibold text-[#0f1114]">
          3. Product, PDF, Supplier &amp; Dynamic Telemetry Data
        </h2>
        <p className="text-[#4b4f57]">
          Depending on which workspace features you use, {siteConfig.siteName}{" "}
          stores and processes the following customer-submitted records scoped
          strictly to your organization via Row Level Security (RLS):
        </p>
        <ul className="list-disc space-y-1.5 pl-5 text-[#4b4f57]">
          <li>
            <strong className="font-semibold text-[#0f1114]">
              Battery specification &amp; DoC PDFs:
            </strong>{" "}
            OEM battery datasheets uploaded for completeness checks and EU
            Declaration of Conformity (DoC) PDFs attached to Article 13(6)
            Simple QR records.
          </li>
          <li>
            <strong className="font-semibold text-[#0f1114]">
              Supplier Magic Link submissions (
              <code className="font-mono text-[#0f1114]">/supplier/[token]</code>
              ):
            </strong>{" "}
            Optional factory or engineer contact labels, submitted technical
            Annex XIII fields, and uploaded supporting test PDFs (such as UN38.3
            summaries) routed into your workspace review queue.
          </li>
          <li>
            <strong className="font-semibold text-[#0f1114]">
              Passport &amp; serialized unit records:
            </strong>{" "}
            Working fields across all three EU Annex XIII access tiers (
            <code className="font-mono text-[#0f1114]">public</code>,{" "}
            <code className="font-mono text-[#0f1114]">legitimate_interest</code>
            , and{" "}
            <code className="font-mono text-[#0f1114]">authorities_only</code>,
            plus private{" "}
            <code className="font-mono text-[#0f1114]">
              additional_information
            </code>
            ), immutable published snapshots, and item-level serial/GTIN rows.
            Public passport pages and public JSON-LD exports strictly expose
            public-tier fields only.
          </li>
          <li>
            <strong className="font-semibold text-[#0f1114]">
              Append-only service &amp; BMS telemetry (
              <code className="font-mono text-[#0f1114]">dynamic_bms_logs</code>
              ):
            </strong>{" "}
            State-of-health (SoH), cycle count, internal resistance, lifecycle
            status, and service notes appended by authorized dealers or
            repairers via{" "}
            <code className="font-mono text-[#0f1114]">/service/[slug]</code> or
            via authenticated Pro REST API keys.
          </li>
        </ul>
        <p className="text-[#4b4f57]">
          Customers should upload technical battery and regulatory documentation
          only and avoid embedding unnecessary personal consumer data in
          datasheets or service notes.
        </p>
      </section>

      <section className="space-y-2.5">
        <h2 className="text-[18px] font-semibold text-[#0f1114]">
          4. Subprocessors &amp; Third-Party Infrastructure
        </h2>
        <p className="text-[#4b4f57]">
          {siteConfig.siteName} relies on the following infrastructure and
          processing partners to deliver the service:
        </p>
        <ul className="list-disc space-y-1.5 pl-5 text-[#4b4f57]">
          <li>
            <strong className="font-semibold text-[#0f1114]">Supabase:</strong>{" "}
            PostgreSQL database hosting with Row Level Security, user
            authentication, encrypted file storage for uploaded PDFs, and
            standard encrypted backups.
          </li>
          <li>
            <strong className="font-semibold text-[#0f1114]">Vercel:</strong>{" "}
            Application hosting, global edge delivery, and standard HTTP access
            and runtime logs.
          </li>
          <li>
            <strong className="font-semibold text-[#0f1114]">
              Google Gemini API / Anthropic API:
            </strong>{" "}
            Stateless PDF text and specification extraction only when an AI
            extraction key is enabled in the deployment. Submitted PDFs are
            processed strictly to return structured static fields and are not
            used to train {siteConfig.siteName} models.
          </li>
          <li>
            <strong className="font-semibold text-[#0f1114]">Paddle:</strong>{" "}
            Merchant of Record for paid Pro subscriptions, invoicing, sales
            tax/VAT collection, and payment processing.{" "}
            {siteConfig.siteName} never receives or stores raw credit card
            numbers.
          </li>
        </ul>
      </section>

      <section className="space-y-2.5">
        <h2 className="text-[18px] font-semibold text-[#0f1114]">
          5. Retention, Portability &amp; Deletion Rights
        </h2>
        <p className="text-[#4b4f57]">
          Uploaded PDFs, passport records, supplier submissions, and dynamic BMS
          logs are retained for as long as the associated workspace account or
          passport record remains active.
        </p>
        <p className="text-[#4b4f57]">
          Authenticated workspace members can export complete workspace data as
          portable JSON anytime from{" "}
          <Link
            href="/app/privacy"
            className="font-medium text-[#145b6e] underline underline-offset-4"
          >
            /app/privacy
          </Link>{" "}
          and permanently delete individual draft or published passports
          (including associated storage PDFs and child records) directly inside{" "}
          <Link
            href="/app"
            className="font-medium text-[#145b6e] underline underline-offset-4"
          >
            /app
          </Link>
          .
        </p>
        <p className="text-[#4b4f57]">
          When you delete a passport or submit a full account deletion request,
          associated uploaded PDFs and active database records are removed upon
          user deletion or within{" "}
          <strong className="font-semibold text-[#0f1114]">30 days</strong> of a
          deletion request (with encrypted infrastructure backups rolling off on
          standard provider retention cycles). To exercise access, correction,
          portability, erasure, or DPA requests, email{" "}
          <a
            href={`mailto:${siteConfig.legal.contactEmail}`}
            className="font-medium text-[#145b6e] underline underline-offset-4"
          >
            {siteConfig.legal.contactEmail}
          </a>
          ; all privacy and deletion requests are answered within{" "}
          <strong className="font-semibold text-[#0f1114]">30 days</strong>.
        </p>
      </section>

      <section className="space-y-2.5">
        <h2 className="text-[18px] font-semibold text-[#0f1114]">
          6. Policy Updates &amp; Contact
        </h2>
        <p className="text-[#4b4f57]">
          We may update this Privacy Policy to reflect operational, technical,
          or regulatory changes by updating the effective date above. Questions
          regarding data protection may be directed to{" "}
          <a
            href={`mailto:${siteConfig.legal.contactEmail}`}
            className="font-medium text-[#145b6e] underline underline-offset-4"
          >
            {siteConfig.legal.contactEmail}
          </a>
          .
        </p>
      </section>
    </LegalDocumentShell>
  );
}
