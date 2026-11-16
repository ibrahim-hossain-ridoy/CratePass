import type { Metadata } from "next";
import { LegalDocumentShell } from "@/components/legal/LegalDocumentShell";
import {
  PUBLIC_MANUFACTURER_NOTICE,
  WORKING_FIELD_LIST_NOTICE,
} from "@/config/battery-fields";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: `Regulatory & Technical Disclaimer (Draft) · ${siteConfig.siteName}`,
  description:
    "Important disclaimer clarifying technical hosting scope and EU Regulation (EU) 2023/1542 working field boundaries (TODO: lawyer review).",
};

export default function DisclaimerPage() {
  return (
    <LegalDocumentShell
      activePath="/disclaimer"
      title="Technical Hosting & Regulatory Disclaimer (Draft)"
      subtitle="Clarifies the boundary between software infrastructure and statutory responsibilities under Regulation (EU) 2023/1542."
      lastUpdatedLabel="Draft · Pending legal review"
    >
      <section className="space-y-2">
        <h2 className="text-[18px] font-semibold text-[var(--ink)]">
          1. Not Legal Advice or a Conformity Authority
        </h2>
        <p className="text-[var(--muted)]">
          {siteConfig.siteName} provides software hosting, structured PDF field extraction,
          and QR delivery URLs only. We are not a notified body, conformity assessment
          authority, accredited verifier, or legal consultancy, and we make no claim that
          using this software satisfies EU battery legislation automatically.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-[18px] font-semibold text-[var(--ink)]">
          2. Working Field List Notice
        </h2>
        <p className="text-[var(--muted)]">
          Every completeness check inside the workspace uses an editable schema stored in{" "}
          <code className="font-mono">src/config/battery-fields.ts</code>:
        </p>
        <blockquote className="rounded-[8px] border border-[var(--border)] bg-[var(--well-soft)] px-4 py-3 font-medium text-[var(--ink)]">
          {WORKING_FIELD_LIST_NOTICE}
        </blockquote>
        <p className="text-[var(--muted)]">
          This working field list is inspired by Regulation (EU) 2023/1542 Annex XIII for
          LMT and e-bike batteries. Always check final statutory schemas, implementing
          acts, and harmonized standards before placing products on the EU market.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-[18px] font-semibold text-[var(--ink)]">
          3. Automated Extraction Limitations &amp; Public Labels
        </h2>
        <p className="text-[var(--muted)]">
          Automated PDF extraction may misread tables, footnotes, units, or multi-column
          datasheets. Customer organizations must manually inspect every extracted field,
          especially items marked Missing or Uncertain, prior to acceptance. All hosted
          passports state clearly:
        </p>
        <blockquote className="rounded-[8px] border border-[var(--border)] bg-[var(--well-soft)] px-4 py-3 font-medium text-[var(--ink)]">
          {PUBLIC_MANUFACTURER_NOTICE}
        </blockquote>
      </section>
    </LegalDocumentShell>
  );
}
