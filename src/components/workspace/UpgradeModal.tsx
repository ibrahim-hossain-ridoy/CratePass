"use client";

import React from "react";
import Link from "next/link";
import { PRO_MONTHLY_EUR, PRO_YEARLY_EUR, getProAnnualSavingsPct } from "@/config/plans";

interface UpgradeModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description: string;
  limitDetail?: string;
}

export function UpgradeModal({
  open,
  onClose,
  title,
  description,
  limitDetail,
}: UpgradeModalProps) {
  if (!open) return null;

  const savingsPct = getProAnnualSavingsPct();

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="upgrade-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
    >
      <div className="tab-panel-enter w-full max-w-[490px] overflow-hidden rounded-[22px] bg-white text-[#0f1114]">
        <div className="bg-[#101214] px-6 py-5 text-[#f4f3ef]">
          <span className="inline-flex rounded-md bg-[#173038] px-2.5 py-0.5 text-[12px] font-semibold text-[#7dd3e8]">
            CratePass Pro · €{PRO_MONTHLY_EUR}/mo
          </span>
          <h2
            id="upgrade-modal-title"
            className="font-display mt-2.5 text-[21px] font-semibold tracking-tight text-white"
          >
            {title}
          </h2>
          <p className="mt-1.5 text-[14px] leading-relaxed text-[#c4c8d0]">
            {description}
          </p>
        </div>

        <div className="space-y-4 p-6">
          {limitDetail && (
            <div className="rounded-[12px] border border-[#ebd0a8] bg-[#fdf6ec] px-4 py-3 text-[13.5px] font-medium text-[#7c380b]">
              {limitDetail}
            </div>
          )}

          <div className="rounded-[14px] bg-[#f4f4f2] p-4">
            <div className="flex items-baseline justify-between gap-2">
              <span className="font-display text-[15px] font-semibold text-[#0f1114]">
                Unlock Pro — €{PRO_MONTHLY_EUR}/month
              </span>
              <span className="num text-[12.5px] font-semibold text-[#156d49]">
                or €{PRO_YEARLY_EUR}/yr (save {savingsPct}%)
              </span>
            </div>
            <ul className="mt-3 space-y-2 text-[13.5px] text-[#22252a]">
              <li className="flex items-center gap-2.5">
                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#145b6e]" />
                <span>Unlimited live published battery models &amp; passports</span>
              </li>
              <li className="flex items-center gap-2.5">
                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#145b6e]" />
                <span>Unlimited bulk CSV GS1 serialized QR units &amp; A4 print sheets</span>
              </li>
              <li className="flex items-center gap-2.5">
                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#145b6e]" />
                <span>Unlimited 5-language Supplier Magic Links, custom domain &amp; SoH portal</span>
              </li>
            </ul>
          </div>

          <p className="text-[12.5px] text-[#505660]">
            Your draft data is preserved safely and is never deleted when you hit a Free plan limit.
          </p>

          <div className="flex flex-wrap items-center justify-end gap-2.5 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="pressable inline-flex min-h-[42px] cursor-pointer items-center justify-center rounded-[10px] bg-[#f4f4f2] px-4 py-2 text-[14px] font-semibold text-[#0f1114] hover:bg-[#e8e7e3]"
            >
              Keep editing draft
            </button>
            <Link
              href="/app/billing"
              className="pressable inline-flex min-h-[42px] items-center justify-center gap-1.5 rounded-[10px] bg-[#145b6e] px-5 py-2 text-[14px] font-semibold text-white hover:bg-[#0e4656]"
            >
              <span>Upgrade to Pro</span>
              <span aria-hidden="true">→</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
