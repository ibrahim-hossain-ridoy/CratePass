import {
  getRequiredFieldsForCategory,
  getStaticRequiredFieldsForCategory,
  type BatteryCategory,
} from "../config/battery-fields.ts";

export type CheckerBatteryChoice =
  | "LMT"
  | "EV"
  | "industrial_gt_2kwh"
  | "simple_qr";

export type CheckerMarketDate =
  | "before_feb_2027"
  | "feb_to_aug_2027"
  | "after_aug_2027";

export type CheckerTurnoverTier =
  | "under_40m"
  | "40m_to_150m"
  | "over_150m";

export type CheckerDatasheetState =
  | "full_pdf"
  | "partial_supplier"
  | "none";

export interface EligibilityWizardInput {
  category: CheckerBatteryChoice;
  marketDate: CheckerMarketDate;
  turnover: CheckerTurnoverTier;
  datasheetState: CheckerDatasheetState;
}

export interface ObligationItem {
  id: string;
  title: string;
  effectiveDate: string;
  status: "mandatory" | "conditional" | "exempt_note";
  regulationRef: string;
  summary: string;
}

export interface EligibilityResult {
  passportMode: "full_passport" | "simple_qr";
  mappedCategory: BatteryCategory | null;
  headline: string;
  subheadline: string;
  obligations: ObligationItem[];
  fieldBreakdown: {
    totalPoints: number;
    publicCount: number;
    legitimateInterestCount: number;
    authoritiesOnlyCount: number;
    staticRequiredCount: number;
    dynamicBmsCount: number;
  };
  workflowTip: {
    title: string;
    detail: string;
    recommendedAction: string;
  };
}

export function evaluateBatteryEligibility(
  input: EligibilityWizardInput,
): EligibilityResult {
  const isFullPassport = input.category !== "simple_qr";
  const mappedCategory: BatteryCategory | null =
    input.category === "LMT"
      ? "LMT"
      : input.category === "EV"
        ? "EV"
        : input.category === "industrial_gt_2kwh"
          ? "industrial"
          : null;

  const obligations: ObligationItem[] = [];

  if (isFullPassport && mappedCategory) {
    obligations.push({
      id: "full_passport",
      title: "Full 71-Point Digital Battery Passport & Casing QR Code",
      effectiveDate: "18 February 2027",
      status:
        input.marketDate === "before_feb_2027" ? "conditional" : "mandatory",
      regulationRef: "Regulation (EU) 2023/1542 · Article 77 & Annex XIII",
      summary:
        input.marketDate === "before_feb_2027"
          ? "Units placed on the EU market strictly before 18 Feb 2027 are outside the initial trigger, while every batch placed on or after 18 Feb 2027 must carry a live Digital Battery Passport QR code."
          : "Every individual battery unit placed on the EU market must carry a permanent QR code linking to its structured Annex XIII Digital Battery Passport.",
    });

    obligations.push({
      id: "eu_dpp_registry",
      title: "EU DPP Registry Unique Identifier Registration",
      effectiveDate: "20 July 2026 (Live)",
      status: "mandatory",
      regulationRef: "Implementing Regulation (EU) 2026/1778 · ISO/IEC 15459",
      summary:
        "Register unique item-level identifiers (GS1 Digital Link / ISO/IEC 15459) and commodity codes pointing to your hosted battery passport before EU customs release.",
    });
  } else {
    obligations.push({
      id: "simple_qr",
      title: "Article 13(6) QR Code Label (No 71-Point Passport Required)",
      effectiveDate: "18 February 2027",
      status: "mandatory",
      regulationRef: "Regulation (EU) 2023/1542 · Article 13(6)",
      summary:
        "Portable, SLI, and industrial batteries ≤ 2 kWh do not need a full 71-point passport, but still require a scannable QR code linking to the EU Declaration of Conformity and separate collection / disposal instructions.",
    });
  }

  // Supply-chain due diligence (postponed to 18 Aug 2027 under Regulation (EU) 2025/1561)
  if (input.turnover === "under_40m") {
    obligations.push({
      id: "due_diligence",
      title: "Battery Supply-Chain Due Diligence (SME Threshold Note)",
      effectiveDate: "18 August 2027",
      status: "exempt_note",
      regulationRef: "Regulation (EU) 2025/1561 (amending Art. 47–48)",
      summary:
        "Economic operators below the €40M annual net turnover threshold are generally outside direct Article 48 due diligence mandates, though larger EU OEM buyers may still request cobalt/lithium/nickel origin notes.",
    });
  } else {
    obligations.push({
      id: "due_diligence",
      title: "Supply-Chain Due Diligence Policy & Public Report",
      effectiveDate: "18 August 2027",
      status: "mandatory",
      regulationRef: "Regulation (EU) 2025/1561 (postponed from Aug 2025)",
      summary:
        "Operators at or above €40M annual net turnover must maintain third-party audited due diligence policies for cobalt, natural graphite, lithium, and nickel and publish a summary reference in the passport.",
    });
  }

  let fieldBreakdown = {
    totalPoints: 5,
    publicCount: 5,
    legitimateInterestCount: 0,
    authoritiesOnlyCount: 0,
    staticRequiredCount: 5,
    dynamicBmsCount: 0,
  };

  if (mappedCategory) {
    const reqAll = getRequiredFieldsForCategory(mappedCategory);
    const staticReq = getStaticRequiredFieldsForCategory(mappedCategory);
    fieldBreakdown = {
      totalPoints: reqAll.length,
      publicCount: reqAll.filter((f) => f.tier === "public").length,
      legitimateInterestCount: reqAll.filter(
        (f) => f.tier === "legitimate_interest",
      ).length,
      authoritiesOnlyCount: reqAll.filter((f) => f.tier === "authorities_only")
        .length,
      staticRequiredCount: staticReq.length,
      dynamicBmsCount: reqAll.filter((f) => f.source === "dynamic").length,
    };
  }

  const workflowTip =
    input.datasheetState === "full_pdf"
      ? {
          title: "Start with an automated PDF completeness check",
          detail:
            "Upload your OEM spec PDF to map static Annex XIII points in seconds and isolate exactly which fields are still missing.",
          recommendedAction: "Upload PDF in CratePass",
        }
      : input.datasheetState === "partial_supplier"
        ? {
            title: "Use 5-Language No-Login Supplier Magic Links (EN / 中文 / 한국어 / 日本語 / Tiếng Việt)",
            detail:
              "Select missing factory fields and send a single zero-login link your Asian/Chinese cell or pack supplier can fill in Simplified Chinese.",
            recommendedAction: "Create draft & generate supplier link",
          }
        : {
            title: "Start with a Blank Draft or Simple QR record",
            detail:
              "Create a structured working record without a PDF, track missing specifications, and publish when ready.",
            recommendedAction: "Start blank passport draft",
          };

  const headline = isFullPassport
    ? `Full Digital Battery Passport applies from 18 February 2027 (${mappedCategory})`
    : "Simple QR Label (Article 13(6)) applies from 18 February 2027";

  const subheadline = isFullPassport
    ? `Your ${mappedCategory} battery activates ${fieldBreakdown.totalPoints} mandatory Annex XIII data points (${fieldBreakdown.staticRequiredCount} static datasheet/factory fields · ${fieldBreakdown.dynamicBmsCount} dynamic in-service BMS points) across 3 access tiers.`
    : "No full 71-point passport is required for this category. Host your EU Declaration of Conformity and separate collection instructions behind a permanent scannable QR code.";

  return {
    passportMode: isFullPassport ? "full_passport" : "simple_qr",
    mappedCategory,
    headline,
    subheadline,
    obligations,
    fieldBreakdown,
    workflowTip,
  };
}
