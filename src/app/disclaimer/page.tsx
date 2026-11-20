import type { Metadata } from "next";
import { LegalDocumentShell } from "@/components/legal/LegalDocumentShell";
import {
  PUBLIC_MANUFACTURER_NOTICE,
  WORKING_FIELD_LIST_NOTICE,
} from "@/config/battery-fields";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: `Regulatory & Technical Disclaimer · ${siteConfig.siteName}`,
  description:
    "Clarifies CratePass technical hosting scope, non-certifier status, and EU Regulation (EU) 2023/1542 Annex XIII working field boundaries.",
};

export default function DisclaimerPage() {
  return (
    <LegalDocumentShell
      activePath="/disclaimer"
      title="Regulatory & Technical Disclaimer"
      subtitle="Clarifies the boundary between technical software hosting infrastructure and statutory duties under Regulation (EU) 2023/1542."
    >
      <section className="space-y-2.5">
        <h2 className="text-[18px] font-semibold text-[#0f1114]">
          1. Not Legal Advice or a Conformity Authority
        </h2>
        <p className="text-[#4b4f57]">
          {siteConfig.siteName} (operated by {siteConfig.legal.operatorName})
          provides technical hosting, structured PDF field extraction, QR label
          serialization, and completeness-check tooling only. We are{" "}
          <strong className="font-semibold text-[#0f1114]">
            not a Notified Body, conformity assessment authority, accredited
            auditor, or legal advisor
          </strong>
          , and we make no claim that using this software satisfies EU battery
          legislation automatically.
        </p>
      </section>

      <section className="space-y-2.5">
        <h2 className="text-[18px] font-semibold text-[#0f1114]">
          2. Working Field List Notice
        </h2>
        <p className="text-[#4b4f57]">
          Every completeness check inside the workspace maps against a
          configurable schema of 71 EU Annex XIII points (50 static datasheet
          points and 21 dynamic in-service BMS points) plus private unmapped
          notes:
        </p>
        <blockquote className="rounded-[10px] border border-[#dad9d3] bg-[#f4f4f2] px-4 py-3 font-medium text-[#0f1114]">
          {WORKING_FIELD_LIST_NOTICE}
        </blockquote>
        <p className="text-[#4b4f57]">
          This working field list is structured around Regulation (EU) 2023/1542
          Annex XIII (covering LMT, EV, and industrial batteries &gt; 2 kWh) and
          Article 13(6) Simple QR requirements. Economic operators must always
          check final statutory texts, delegated acts, EU Registry implementing
          regulations, and harmonized standards before placing batteries on the
          EU market.
        </p>
      </section>

      <section className="space-y-2.5">
        <h2 className="text-[18px] font-semibold text-[#0f1114]">
          3. Automated Extraction Limitations &amp; Operator Declaration
        </h2>
        <p className="text-[#4b4f57]">
          Automated PDF extraction may misread tables, footnotes, units, or
          multi-column datasheets. Economic operators must review every
          extracted and supplier-submitted value — especially fields flagged as
          Missing or Uncertain — before accepting the accuracy declaration and
          publishing. Public routes and exported audit documents clearly state:
        </p>
        <blockquote className="rounded-[10px] border border-[#dad9d3] bg-[#f4f4f2] px-4 py-3 font-medium text-[#0f1114]">
          {PUBLIC_MANUFACTURER_NOTICE}
        </blockquote>
      </section>
    </LegalDocumentShell>
  );
}
