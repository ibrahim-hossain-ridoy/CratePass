import type { Metadata } from "next";
import Link from "next/link";
import { LegalDocumentShell } from "@/components/legal/LegalDocumentShell";
import {
  FREE_PLAN_LIMITS,
  PRO_MONTHLY_EUR,
  PRO_YEARLY_EUR,
} from "@/config/plans";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: `Terms of Service · ${siteConfig.siteName}`,
  description:
    "B2B Terms of Service for CratePass EU Battery Passport hosting, Free & Pro subscription terms, Paddle billing, and non-certifier technical hosting boundaries.",
};

export default function TermsPage() {
  return (
    <LegalDocumentShell
      activePath="/terms"
      title="Terms of Service"
      subtitle="Governs B2B workspace access to upload battery specification PDFs, run Annex XIII completeness checks, serialize GS1 QR labels, and host public battery passport routes."
    >
      <section className="space-y-2.5">
        <h2 className="text-[18px] font-semibold text-[#0f1114]">
          1. B2B Service &amp; Eligibility (18+)
        </h2>
        <p className="text-[#4b4f57]">
          {siteConfig.siteName} is operated by{" "}
          <strong className="font-semibold text-[#0f1114]">
            {siteConfig.legal.operatorName}
          </strong>{" "}
          and is offered strictly as a business-to-business (B2B) software
          platform for battery manufacturers, EU importers, OEMs, distributors,
          and their authorized representatives. By creating an account or using
          the service, you confirm that you are at least{" "}
          <strong className="font-semibold text-[#0f1114]">18+</strong> years of
          age and have authority to bind the business entity you represent.
        </p>
      </section>

      <section className="space-y-2.5">
        <h2 className="text-[18px] font-semibold text-[#0f1114]">
          2. Strict Non-Certifier &amp; Technical Hosting Disclaimer
        </h2>
        <p className="text-[#4b4f57]">
          {siteConfig.siteName} provides technical hosting, PDF attribute
          extraction, QR serialization, and completeness-check tooling for EU
          Battery Regulation (EU) 2023/1542.{" "}
          <strong className="font-semibold text-[#0f1114]">
            {siteConfig.siteName} is NOT a Notified Body, accredited laboratory,
            legal advisor, or compliance certifier.
          </strong>{" "}
          Completeness summaries use a working field list — check against the
          official regulation and applicable implementing acts before placing
          any battery on the EU market.
        </p>
        <p className="text-[#4b4f57]">
          Before publishing any passport snapshot, an authorized workspace user
          must review all extracted, supplier-submitted, and manually entered
          fields and confirm responsibility for accuracy. Published records
          under <code className="font-mono text-[#0f1114]">/p/[slug]</code> are
          declared by the economic operator and are not verified by CratePass.
          The economic operator remains solely responsible for the accuracy,
          completeness, and legal conformity of all declared data.
        </p>
      </section>

      <section className="space-y-2.5">
        <h2 className="text-[18px] font-semibold text-[#0f1114]">
          3. Plans, Pricing &amp; Auto-Renewing Subscriptions
        </h2>
        <p className="text-[#4b4f57]">
          Current plans and limits are published on our{" "}
          <Link
            href="/pricing"
            className="font-medium text-[#145b6e] underline underline-offset-4"
          >
            Pricing page
          </Link>
          :
        </p>
        <ul className="list-disc space-y-1.5 pl-5 text-[#4b4f57]">
          <li>
            <strong className="font-semibold text-[#0f1114]">
              Free Plan (€0/month):
            </strong>{" "}
            Includes up to {FREE_PLAN_LIMITS.maxPublishedPassports} live
            published passports (or Article 13(6) Simple QR records), up to{" "}
            {FREE_PLAN_LIMITS.maxSerializedUnits} serialized unit QR codes
            across the workspace, and {FREE_PLAN_LIMITS.dailyPdfExtractions}{" "}
            daily AI PDF completeness checks.
          </li>
          <li>
            <strong className="font-semibold text-[#0f1114]">
              CratePass Pro (€{PRO_MONTHLY_EUR}/month or €{PRO_YEARLY_EUR}
              /year):
            </strong>{" "}
            Unlocks unlimited live published passports, unlimited bulk CSV GS1
            serialized units and A4 print sheets, unlimited 5-language Supplier
            Magic Links, custom subdomain branding, Dealer/Repairer SoH Portal
            PINs, and Pro REST API keys.
          </li>
        </ul>
        <p className="text-[#4b4f57]">
          Paid Pro subscriptions are billed in advance through{" "}
          <strong className="font-semibold text-[#0f1114]">Paddle</strong>{" "}
          acting as Merchant of Record (handling invoicing, applicable VAT/sales
          tax, and payment processing) and{" "}
          <strong className="font-semibold text-[#0f1114]">auto-renew</strong>{" "}
          at the end of each monthly or annual billing cycle until cancelled.
          Cancellation and refund terms are detailed in our{" "}
          <Link
            href="/refund"
            className="font-medium text-[#145b6e] underline underline-offset-4"
          >
            Refund &amp; Cancellation Policy
          </Link>
          .
        </p>
      </section>

      <section className="space-y-2.5">
        <h2 className="text-[18px] font-semibold text-[#0f1114]">
          4. Pricing Changes &amp; Service Continuity Commitment
        </h2>
        <p className="text-[#4b4f57]">
          We will provide active paid subscribers at least{" "}
          <strong className="font-semibold text-[#0f1114]">
            30 days&rsquo; written notice
          </strong>{" "}
          (by email to the workspace owner) before any material pricing change
          takes effect on their subscription renewal.
        </p>
        <p className="text-[#4b4f57]">
          To prevent vendor lock-in for long-lived battery QR codes, if{" "}
          {siteConfig.siteName} ever discontinues the hosted service, we will
          provide at least{" "}
          <strong className="font-semibold text-[#0f1114]">
            90 days&rsquo; advance written notice
          </strong>{" "}
          and maintain uninterrupted access to full{" "}
          <strong className="font-semibold text-[#0f1114]">
            JSON and CSV exports
          </strong>{" "}
          so customers can migrate their passports and serial identifiers to
          another host cleanly.
        </p>
      </section>

      <section className="space-y-2.5">
        <h2 className="text-[18px] font-semibold text-[#0f1114]">
          5. Acceptable Use &amp; Customer Ownership of Data
        </h2>
        <p className="text-[#4b4f57]">
          Customers retain full ownership of all uploaded datasheets, DoC PDFs,
          supplier submissions, and declared passport records. You grant{" "}
          {siteConfig.siteName} a limited license strictly to store, process,
          and publicly host the public-tier fields and QR routes you choose to
          publish. You may upload only technical documentation you are
          authorized to process (PDF format, maximum 10 MB per upload) and must
          not attempt prompt injection, upload malware, impersonate third-party
          brands, or probe/bypass tenant isolation controls.
        </p>
      </section>

      <section className="space-y-2.5">
        <h2 className="text-[18px] font-semibold text-[#0f1114]">
          6. Warranties &amp; Limitation of Liability
        </h2>
        <p className="text-[#4b4f57]">
          The software is provided &ldquo;as is&rdquo; and &ldquo;as
          available&rdquo; without warranties of regulatory acceptance or
          uninterrupted operation. To the fullest extent permitted by applicable
          law, {siteConfig.legal.operatorName} will not be liable for indirect,
          incidental, consequential, or regulatory penalty damages, and total
          aggregate liability arising out of these Terms is limited to the
          subscription fees actually paid by your organization during the twelve
          (12) months preceding the claim.
        </p>
      </section>

      <section className="space-y-2.5">
        <h2 className="text-[18px] font-semibold text-[#0f1114]">
          7. Governing Law &amp; Legal Notices
        </h2>
        <p className="text-[#4b4f57]">
          These Terms are governed by the laws of{" "}
          <strong className="font-semibold text-[#0f1114]">
            {siteConfig.legal.governingLaw}
          </strong>
          , with B2B personal data handling aligned to EU GDPR principles (a
          formal EU Article 27 representative notice and DPA are available on
          request). Formal notices, support inquiries, or requests for full
          correspondence address details may be emailed to{" "}
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
