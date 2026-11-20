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
  title: `Refund & Cancellation Policy · ${siteConfig.siteName}`,
  description:
    "Clear Paddle Merchant of Record billing, cancel-anytime subscription terms, and 14-day refund policy for CratePass Pro.",
};

export default function RefundPolicyPage() {
  return (
    <LegalDocumentShell
      activePath="/refund"
      title="Refund & Cancellation Policy"
      subtitle="Transparent cancellation rules, Paddle Merchant of Record payment handling, and our 14-day refund policy for CratePass Pro subscriptions."
    >
      <section className="space-y-2.5">
        <h2 className="text-[18px] font-semibold text-[#0f1114]">
          1. Payments Processed by Paddle (Merchant of Record)
        </h2>
        <p className="text-[#4b4f57]">
          All paid {siteConfig.siteName} Pro subscriptions (€{PRO_MONTHLY_EUR}
          /month or €{PRO_YEARLY_EUR}/year) are processed, invoiced, and
          collected by{" "}
          <strong className="font-semibold text-[#0f1114]">Paddle</strong>{" "}
          (Paddle.com Market Ltd / Paddle.com Inc.) acting as our{" "}
          <strong className="font-semibold text-[#0f1114]">
            Merchant of Record
          </strong>
          . Paddle handles payment card processing, applicable EU VAT and local
          sales taxes, official tax invoices, and refund settlement.{" "}
          {siteConfig.siteName} never stores raw credit card details.
        </p>
      </section>

      <section className="space-y-2.5">
        <h2 className="text-[18px] font-semibold text-[#0f1114]">
          2. Cancel Anytime — No Lock-In
        </h2>
        <p className="text-[#4b4f57]">
          You can cancel your {siteConfig.siteName} Pro subscription at any time
          directly from{" "}
          <Link
            href="/app/billing"
            className="font-medium text-[#145b6e] underline underline-offset-4"
          >
            /app/billing
          </Link>{" "}
          or via the Paddle customer portal link included in every Paddle
          receipt and invoice email.
        </p>
        <ul className="list-disc space-y-1.5 pl-5 text-[#4b4f57]">
          <li>
            Cancellation immediately stops future auto-renewal charges.
          </li>
          <li>
            Your Pro features remain active until the end of your current paid
            monthly or annual billing period.
          </li>
          <li>
            When the paid period ends, your workspace moves cleanly back to the
            Free Plan (up to {FREE_PLAN_LIMITS.maxPublishedPassports} live
            published passports, {FREE_PLAN_LIMITS.maxSerializedUnits}{" "}
            serialized units, and {FREE_PLAN_LIMITS.dailyPdfExtractions} daily
            PDF checks) and your saved drafts and JSON export access remain
            intact.
          </li>
        </ul>
      </section>

      <section className="space-y-2.5">
        <h2 className="text-[18px] font-semibold text-[#0f1114]">
          3. 14-Day Refund Policy
        </h2>
        <p className="text-[#4b4f57]">
          In line with Paddle&rsquo;s buyer protection rules, we provide a clear{" "}
          <strong className="font-semibold text-[#0f1114]">
            14-day refund policy
          </strong>
          :
        </p>
        <ul className="list-disc space-y-1.5 pl-5 text-[#4b4f57]">
          <li>
            <strong className="font-semibold text-[#0f1114]">
              Initial Pro purchases:
            </strong>{" "}
            If {siteConfig.siteName} Pro is not the right fit for your team,
            request a full refund within{" "}
            <strong className="font-semibold text-[#0f1114]">
              14 calendar days
            </strong>{" "}
            of your initial monthly or annual Pro payment.
          </li>
          <li>
            <strong className="font-semibold text-[#0f1114]">
              Accidental duplicate charges or billing errors:
            </strong>{" "}
            Any duplicate charge or unauthorized billing error will be refunded
            in full promptly upon verification with Paddle.
          </li>
          <li>
            <strong className="font-semibold text-[#0f1114]">
              Subsequent renewals:
            </strong>{" "}
            Recurring renewal charges after the initial 14-day period are
            non-refundable once the new period begins unless required by
            applicable consumer/buyer protection law or in the case of a billing
            error — cancel before your renewal date to avoid the next charge.
          </li>
        </ul>
      </section>

      <section className="space-y-2.5">
        <h2 className="text-[18px] font-semibold text-[#0f1114]">
          4. How to Request a Refund
        </h2>
        <p className="text-[#4b4f57]">
          To request a refund within 14 days (or report a duplicate charge),
          email{" "}
          <a
            href={`mailto:${siteConfig.legal.contactEmail}`}
            className="font-medium text-[#145b6e] underline underline-offset-4"
          >
            {siteConfig.legal.contactEmail}
          </a>{" "}
          with your workspace email address and Paddle order/invoice ID, or
          contact Paddle Buyer Support directly via the link on your Paddle
          receipt. Approved refunds are processed by Paddle back to the original
          payment method (typically appearing within 5–10 business days
          depending on your card issuer or bank).
        </p>
      </section>

      <section className="space-y-2.5">
        <h2 className="text-[18px] font-semibold text-[#0f1114]">
          5. Evaluate Risk-Free on the Free Plan
        </h2>
        <p className="text-[#4b4f57]">
          Every new workspace starts on the Free Plan (€0/month, no credit card
          required) with {FREE_PLAN_LIMITS.maxPublishedPassports} live published
          passports, {FREE_PLAN_LIMITS.maxSerializedUnits} serialized unit QR
          codes, and full 71-point Annex XIII completeness checks so your team
          can evaluate workflows before upgrading. See full plan details on our{" "}
          <Link
            href="/pricing"
            className="font-medium text-[#145b6e] underline underline-offset-4"
          >
            Pricing page
          </Link>{" "}
          and{" "}
          <Link
            href="/terms"
            className="font-medium text-[#145b6e] underline underline-offset-4"
          >
            Terms of Service
          </Link>
          .
        </p>
      </section>
    </LegalDocumentShell>
  );
}
