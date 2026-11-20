import type { Metadata } from "next";
import { EligibilityChecker } from "@/components/checker/EligibilityChecker";

export const metadata: Metadata = {
  title: "EU Battery Passport Eligibility & Gap Checker | CratePass",
  description:
    "Free 4-step EU Battery Regulation (EU) 2023/1542 eligibility checker. See applicable 2026–2027 dates, Annex XIII field counts, and whether you need a full passport or Simple QR label.",
};

export default function CheckerPage() {
  return <EligibilityChecker />;
}
