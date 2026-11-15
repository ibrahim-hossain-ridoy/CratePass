---
impeccable:design-schema: 1
mode: operate
surface: warm-technical-manual
palette:
  ground: "#F5F4F0"
  surface: "#FFFFFF"
  well: "#ECEAE3"
  wellSoft: "#F0EFEA"
  border: "#DDD9CE"
  borderStrong: "#C6C1B4"
  rule: "#E8E5DC"
  ink: "#141413"
  muted: "#57534E"
  accent: "#EA580C"
  accentInk: "#B43D06"
  accentSoft: "#FFF1EA"
  accentBorder: "#F5C3A8"
  positive: "#15803D"
  positiveBg: "#ECFDF3"
  positiveBorder: "#B8E6C8"
  noticeBg: "#FEF7E6"
  noticeBorder: "#EED28A"
  noticeInk: "#7C4A03"
typography:
  sans: "Space Grotesk"
  mono: "JetBrains Mono"
  tabularNumerals: true
radius:
  card: "10px"
  well: "8px"
  pill: "9999px"
---

# DESIGN.md — Demo Brand DB-36V Digital Product Passport

## Overview

Direction A implements a high-craft **Technical Field Manual** aesthetic inspired by Dieter Rams' Braun hardware manuals and Teenage Engineering spec sheets. Designed first for mobile QR-scan sessions and scannable on desktop displays, every screen uses tactile hairline rules, crisp `10px` structural cards, and high-contrast ink over warm technical paper (`#F5F4F0`) without SaaS gradients, drop shadows, or decorative chrome.

## Colors

| Token | Hex | Role |
| :--- | :--- | :--- |
| `--ground` | `#F5F4F0` | Warm alabaster paper canvas |
| `--surface` | `#FFFFFF` | Primary spec cards and active certificate surface |
| `--well` | `#ECEAE3` | Recessed schematic wells, active pill badges |
| `--well-soft` | `#F0EFEA` | Subtle row hover or inset callout background |
| `--border` | `#DDD9CE` | Primary 1px hairline card and cell borders |
| `--border-strong` | `#C6C1B4` | High-emphasis borders and focus outlines |
| `--rule` | `#E8E5DC` | Internal divider rules between `<dl>` rows |
| `--ink` | `#141413` | Primary charcoal ink (~15.5:1 on `#FFFFFF`) |
| `--muted` | `#57534E` | Secondary metadata and labels (~6.5:1 on `#FFFFFF`) |
| `--accent` | `#EA580C` | Safety orange for active hotspots and primary indicators |
| `--accent-ink` | `#B43D06` | Accessible dark safety-orange text (>= 4.5:1 on `#FFF1EA`) |
| `--accent-soft` | `#FFF1EA` | Tinted background for restricted/safety pills |
| `--accent-border` | `#F5C3A8` | Hairline border for safety-orange callouts |
| `--positive` | `#15803D` | Forest green for lifecycle impact & recycling status |
| `--positive-bg` | `#ECFDF3` | Soft green callout background |
| `--positive-border` | `#B8E6C8` | Soft green pill and panel border |
| `--notice-bg` | `#FEF7E6` | Warm amber pill background for `"Concept demo – fictional data"` |
| `--notice-border` | `#EED28A` | Warm amber border for demo disclosures |
| `--notice-ink` | `#7C4A03` | High-contrast amber text |

## Typography

- **Primary Sans (`--font-space-grotesk`):** `Space Grotesk` (`400`, `500`, `600`, `700`) for product headings, group labels, body copy, and interactive navigation.
- **Technical Mono (`--font-jetbrains-mono`):** `JetBrains Mono` (`400`, `500`, `600`) for passport IDs, serial numbers, firmware builds, batch codes, digest strings, and demo disclosure tags.
- **Numerals (`.num`):** All percentages, carbon metrics (`kg CO2e`), voltage/capacity ratings, and timestamps enforce `font-variant-numeric: tabular-nums`.

## Layout

- **Mobile-first Container:** `max-w-5xl` centered sheet with `px-4 sm:px-6`.
- **Navigation Pattern:** Sticky compact top identity bar (`Header`) + horizontal tab strip (`#tab-desktop-*`) on `md:` viewports (`>= 768px`), paired with a fixed bottom navigation bar (`#tab-mobile-*`, `min-h-[52px]` touch targets, safe-area inset aware) below `768px` (`pb-24 md:pb-12` on `<main>`).
- **Row & Grid Rhythm (`PassportDataTab`):** Uniform full-width two-column technical datasheet bands (`md:grid-cols-2 md:divide-x`) stacking cleanly on mobile:
  - `Identity`: specifications left | accountable Manufacturer & EU responsible person right.
  - `Integrity`: State of health (`98.4%`), cycle life & ingress left | operating limits, tamper seal & BMS firmware right.
  - `Care & Repair`: charging/storage/inspection/serviceability specs left | bulleted handling precautions right.
  - `Impact`: carbon lifecycle bars left | material mass share breakdown right.

## Elevation & Depth

- **Zero Drop Shadows:** Cards rely strictly on `1px solid var(--border)` contrast steps (`#FFFFFF` over `#F5F4F0`) and `var(--well)` (`#ECEAE3`) insets.
- **Hardware Visuals & Vector Overlay:** Local studio product renders (`public/images/battery-pack-studio.jpg`, `public/images/battery-cutaway-25d.jpg`) paired with precision `1px` SVG leader lines and interactive hotspot pins (`RepairViewTab`) rather than heavy WebGL bundles or drop shadows.

## Shapes

- **Structural Cards:** `rounded-[10px]` (`10px`) across all top-level passport panels.
- **Recessed Wells & Buttons:** `rounded-[8px]` (`8px`) for schematic frames, tab pills, and callout boxes.
- **Status & Access Badges:** `rounded-full` pills (`Public`, `Restricted (authorities/repairers)`, `Concept demo – fictional data`, `DEMO – no real verification performed`).

## Components

- **Header (`Header.tsx`):** Displays brand eyebrow (`DEMO BRAND`), product title (`DB-36V Battery Pack`), key specs strip, and persistent amber pill `Concept demo – fictional data`.
- **TabNav (`TabNav.tsx`):** Single source of truth for the 4 tabs (`Passport`, `Repair`, `Journey`, `Authenticity`) across desktop horizontal tabs and mobile fixed bottom bar (`role="tablist"` / `aria-selected`).
- **PassportDataTab (`PassportDataTab.tsx`):** Four grouped sections (`Identity`, `Integrity`, `Care & Repair`, `Impact`), each stamped with its static visual access tier badge (`Public` or `Restricted (authorities/repairers)`).
- **RepairViewTab (`RepairViewTab.tsx`):** Local `2.5D` cutaway hardware render + SVG vector leader lines and 4 hotspot pins (`Fuse`, `Latch`, `Cell Pack`, `BMS Board`). Discriminates strictly between `user-repair` (`Fuse`, `Latch`) and `authorised-only` (`Cell Pack`, `BMS Board` -> `"Authorised service only – do not open the pack"` + spare-part placeholder).
- **SupplyJourneyTab (`SupplyJourneyTab.tsx`):** Static 4-stage vertical/horizontal provenance timeline (`Raw Material Origin` -> `Cell Manufacturing` -> `Pack Assembly` -> `EU Distribution Hub`) using fictional entities and facility IDs.
- **AuthenticityTab (`AuthenticityTab.tsx`):** Certificate-framed card where status, verification timestamp, and cryptographic digest are each explicitly labeled `"DEMO – no real verification performed"`, followed by EU end-of-life battery return & chemistry recycling rules.

## Do's and Don'ts

- **Do:** Use CSS-only transitions (`.pressable` scale `0.97` on `:active`, `.tab-panel-enter`, `.hotspot-card-enter`) gated behind `prefers-reduced-motion`.
- **Do:** Keep every tab visibly tagged with `"Concept demo – fictional data"` and every entity fictional.
- **Don't:** Add third-party animation libraries, drop shadows, purple/blue gradients, real manufacturer names, legal compliance claims, bare `"Verified"` / `"Authentic"` status badges, or DIY pack-opening instructions.
