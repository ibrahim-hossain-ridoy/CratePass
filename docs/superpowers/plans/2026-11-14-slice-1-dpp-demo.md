# Slice 1 — EU Digital Product Passport Concept Demo Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a single-page, mobile-first Next.js (App Router) + Tailwind CSS + TypeScript concept demo of an EU Digital Product Passport for the fictional **Demo Brand — DB-36V Battery Pack**, driven entirely from `src/data/passport.json` and styled in Direction A (Braun / Teenage Engineering Technical Manual).

**Architecture:** A single static client shell (`src/app/page.tsx`) backed by strongly typed local JSON (`src/data/passport.json` / `src/types/passport.ts`) switches cleanly across 4 domain views (`PassportDataTab`, `RepairViewTab`, `SupplyJourneyTab`, `AuthenticityTab`). Mobile screens (`< 768px`) navigate via a fixed bottom thumb bar while desktop (`>= 768px`) uses a top tab strip beneath the persistent header and `"Concept demo – fictional data"` badge.

**Tech Stack:** Next.js (App Router), React, TypeScript, Tailwind CSS, Google Fonts via `next/font/google` (`Space Grotesk` + `JetBrains Mono`), CSS-only motion (`prefers-reduced-motion` aware), Node `node --test` for the single smoke test.

## Global Constraints

- Brand `"Demo Brand"`, Product `"DB-36V Battery Pack"`; visible `"Concept demo – fictional data"` badge on every tab.
- Zero legal compliance claims (`"100% compliant"`, certification claims, etc.) anywhere in UI, copy, or JSON.
- Fictional entities, facilities, manufacturers, EU responsible persons, and addresses only.
- Repair View safety: **only `Fuse` and `Latch`** expose user-level repair steps; **`Cell Pack` and `BMS Board`** display `"Authorised service only – do not open the pack"` + spare-part placeholder with zero DIY disassembly instructions.
- Authenticity Tab: every status, timestamp, and digest explicitly carries `"DEMO – no real verification performed"`; never use `"Verified"` or `"Authentic"` without that label.
- Tab 1 field groups carry visual-only `"Public"` or `"Restricted (authorities/repairers)"` tags (no gating logic).
- CSS-only animations respecting `prefers-reduced-motion`, no animation library, no external runtime API requests.
- Max 1 smoke test; preserve existing `.agents`, `.claude`, `.aider-desk`, `agent`, `AGENTS.md`, `GEMINI.md`, `skills-lock.json`.

## Review Focus

- **Safety boundary bypass on Tab 2:** Selecting `cell-pack` or `bms-board` must never render tool/time/DIY step copy and must always render `"Authorised service only – do not open the pack"`.
- **Verification wording leak on Tab 4:** Status, timestamp, and digest fields must never present `"Verified"` or `"Authentic"` unaccompanied by `"DEMO – no real verification performed"`.
- **Mobile bottom bar obstruction:** Fixed bottom tab bar on `390px` viewports must have `>= 44px` touch targets and main content must keep sufficient bottom clearance (`pb-24`) so cards/actions never hide behind the bar.
- **Data arithmetic consistency:** Carbon lifecycle shares and material mass percentages in `passport.json` must sum cleanly to `100%`, and every metric must carry explicit units.
- **Demo badge persistence:** Switching across all 4 tabs must never hide or scroll away the `"Concept demo – fictional data"` badge in the header.

---

### Task 1: Workspace Scaffold & Git Setup

**Files:**
- Preserve: `.agents/`, `.claude/`, `.aider-desk/`, `agent/`, `AGENTS.md`, `GEMINI.md`, `skills-lock.json`
- Create/Move from `/tmp/dpp-scaffold`: `package.json`, `tsconfig.json`, `next.config.*`, `eslint.config.*`, `postcss.config.*`, `src/app/`
- Create: `.gitignore`, `ROADMAP.md`, `PRODUCT.md`, `DESIGN.md`

- [ ] **Step 1:** Run `git init` in `/Users/hello/website`.
- [ ] **Step 2:** Scaffold Next.js App Router + Tailwind + TypeScript in `/tmp/dpp-scaffold` and copy non-conflicting project files into `/Users/hello/website` without overwriting workspace rules/skills.
- [ ] **Step 3:** Configure `next.config.ts` (`images: { unoptimized: true }`) and verify `npm run build` succeeds on baseline.

### Task 2: Domain Types & Fictional Passport Dataset

**Files:**
- Create: `src/types/passport.ts`
- Create: `src/data/passport.json`

- [ ] **Step 1:** Define `PassportDocument` interfaces covering `meta`, `passportData` (with `accessTier: "Public" | "Restricted (authorities/repairers)"` per group), `repairView` (discriminated safety union `serviceability: "user" | "authorised-only"`), `supplyJourney`, and `authenticity`.
- [ ] **Step 2:** Author `src/data/passport.json` with realistic fictional EU e-bike battery metrics (`36 V`, `14.5 Ah`, `522 Wh`, `NMC 811`, `68.4 kg CO2e` summing to `100%`, materials summing to `100%`), fictional entities, and strict safety + demo labels.

### Task 3: Design System Foundation (Direction A) & Inline Iconography

**Files:**
- Modify: `src/app/layout.tsx`, `src/app/globals.css`
- Create: `src/components/Icons.tsx`

- [ ] **Step 1:** Load `Space Grotesk` and `JetBrains Mono` via `next/font/google` in `layout.tsx`, configure mobile viewport (`viewportFit: "cover"`), and semantic metadata (`title`, `description`).
- [ ] **Step 2:** Define Direction A CSS tokens (`#F5F4F0` ground, `#FFFFFF` card surface, `#FAF9F6` recessed well, `#141413` primary ink, `#57534E` secondary ink, `#E2E0D8` hairline, `#EA580C` / `#C2410C` safety orange, `#15803D` forest green), tabular numerals, custom scrollbar/selection, tactile CSS transitions (`--ease-out: cubic-bezier(0.23, 1, 0.32, 1)`), and `@media (prefers-reduced-motion: reduce)` guards.
- [ ] **Step 3:** Create `src/components/Icons.tsx` with crisp 1.5px stroke outline SVGs (Passport, Wrench/Repair, Route/Journey, Shield/Certificate, Globe, Lock, AlertTriangle, Check, Recycle/Crossed-Bin).

### Task 4: Persistent Shell (`Header`, `TabNav`, `page.tsx`)

**Files:**
- Create: `src/components/Header.tsx`
- Create: `src/components/TabNav.tsx`
- Modify: `src/app/page.tsx`

- [ ] **Step 1:** Build `Header` displaying `"Demo Brand"`, `"DB-36V Battery Pack"`, passport serial chip, and the high-contrast `"Concept demo – fictional data"` badge on every tab.
- [ ] **Step 2:** Build `TabNav` rendering a fixed bottom thumb bar on mobile (`md:hidden`, 44px+ hit targets, safe-area inset) and a crisp segmented/underlined tab bar on desktop (`hidden md:block`).
- [ ] **Step 3:** Wire `page.tsx` client tab switching with CSS-only panel fade/rise (`prefers-reduced-motion` safe) and accessible `role="tablist"` / `role="tabpanel"` semantics.

### Task 5: Four Domain Tabs

**Files:**
- Create: `src/components/tabs/PassportDataTab.tsx`
- Create: `src/components/tabs/RepairViewTab.tsx`
- Create: `src/components/tabs/SupplyJourneyTab.tsx`
- Create: `src/components/tabs/AuthenticityTab.tsx`

- [ ] **Step 1:** Implement `PassportDataTab` with grouped sections (`Identity`, `Integrity`, `Care/Repair`, `Impact`), visual `"Public"` / `"Restricted (authorities/repairers)"` tags per group, carbon footprint breakdown bars, and material composition rows.
- [ ] **Step 2:** Implement `RepairViewTab` with a precision 2.5D isometric SVG battery pack cutaway illustration and 4 clickable hotspot pins + mobile-friendly pill selector (`Cell Pack`, `BMS Board`, `Fuse`, `Latch`). Enforce strict safety rendering (`Fuse` & `Latch` show step + tool + spare part; `Cell Pack` & `BMS Board` show `"Authorised service only – do not open the pack"` + spare-part placeholder).
- [ ] **Step 3:** Implement `SupplyJourneyTab` showing the static 4-stage schematic chain (`Raw Material Origin` → `Cell Factory` → `Assembly` → `EU Warehouse`) with SVG route connectors, fictional facility addresses, date windows, and transport notes.
- [ ] **Step 4:** Implement `AuthenticityTab` with a hardware-certificate card where status, timestamp, and digest each explicitly carry `"DEMO – no real verification performed"`, followed by end-of-life recycling instructions and a vector crossed-out wheeled bin symbol.

### Task 6: Single Smoke Test, `DESIGN.md`, Build & Visual Verification

**Files:**
- Create: `src/__tests__/smoke.test.mjs`
- Create: `DESIGN.md`

- [ ] **Step 1:** Write `src/__tests__/smoke.test.mjs` (`node --test`) verifying `passport.json` invariants (fictional demo badge, zero compliance claims, sum of carbon/material percentages === 100, repair safety split between Fuse/Latch vs Cell Pack/BMS Board, `"DEMO – no real verification performed"` on status/timestamp/digest) and checking built page output / component wiring.
- [ ] **Step 2:** Run `npm run lint`, `npm run build`, and `node --test src/__tests__/smoke.test.mjs`.
- [ ] **Step 3:** Start production server (`npm run start`) and run `design-taste-frontend` `lint.mjs --app` + `inspect.mjs --app` across `1440`, `768`, and `390` viewports, plus inspect interactive tabs/hotspots visually in screenshots!
- [ ] **Step 4:** Write `DESIGN.md` reflecting the built Direction A system.
