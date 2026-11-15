"use client";

import { useState } from "react";
import rawPassport from "@/data/passport.json";
import type { PassportDocument, TabId } from "@/types/passport";
import { Header } from "@/components/Header";
import { TabNav } from "@/components/TabNav";
import { PassportDataTab } from "@/components/tabs/PassportDataTab";
import { RepairViewTab } from "@/components/tabs/RepairViewTab";
import { SupplyJourneyTab } from "@/components/tabs/SupplyJourneyTab";
import { AuthenticityTab } from "@/components/tabs/AuthenticityTab";

const passport = rawPassport as PassportDocument;

export default function DemoPassportPage() {
  const [activeTab, setActiveTab] = useState<TabId>("passport");

  const handleTabChange = (nextTab: TabId) => {
    setActiveTab(nextTab);
    if (typeof window !== "undefined" && window.scrollY > 96) {
      window.scrollTo({ top: 0, behavior: "instant" });
    }
  };

  const { identity } = passport.passportData;
  const specLine = `${identity.data.nominalVoltage} · ${identity.data.ratedCapacity} · ${identity.data.energyCapacity}`;

  return (
    <div className="flex min-h-svh flex-col bg-[var(--ground)] text-[var(--ink)]">
      <Header
        meta={passport.meta}
        passportId={identity.data.passportId}
        specLine={specLine}
      />

      <TabNav activeTab={activeTab} onChange={handleTabChange} />

      <main className="mx-auto w-full max-w-[960px] flex-1 px-4 pt-5 pb-28 sm:px-6 md:pb-12">
        {activeTab === "passport" && (
          <PassportDataTab data={passport.passportData} />
        )}
        {activeTab === "repair" && (
          <RepairViewTab repairView={passport.repairView} />
        )}
        {activeTab === "journey" && (
          <SupplyJourneyTab stages={passport.supplyJourney} />
        )}
        {activeTab === "authenticity" && (
          <AuthenticityTab authenticity={passport.authenticity} />
        )}

        <footer className="mt-6 border-t border-[var(--border)] pt-4 text-[12px] text-[var(--muted)]">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <span>{passport.meta.disclaimer}</span>
            <span className="shrink-0 font-medium text-[var(--ink)]">
              {passport.meta.badgeText}
            </span>
          </div>
        </footer>
      </main>
    </div>
  );
}
