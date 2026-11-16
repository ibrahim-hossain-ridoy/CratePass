---
impeccable:design-schema: 1
mode: operate
surface: hybrid-obsidian-telemetry-ledger
palette:
  ground: "#F2F4F7"
  surface: "#FFFFFF"
  well: "#E5E9F0"
  wellSoft: "#EEF1F6"
  border: "#D5DCE6"
  borderStrong: "#B6C2D2"
  rule: "#E3E8F0"
  ink: "#0B1017"
  muted: "#4A5565"
  accent: "#1D4ED8"
  accentInk: "#1E40AF"
  accentSoft: "#EFF6FF"
  accentBorder: "#BFDBFE"
  positive: "#047857"
  positiveBg: "#ECFDF5"
  positiveBorder: "#A7F3D0"
  noticeBg: "#FEF7E6"
  noticeBorder: "#E5C168"
  noticeInk: "#7C4A03"
  stageBg: "#0B1016"
  stageSurface: "#121A23"
  stageBorder: "#233242"
  stageInk: "#F1F5F9"
  stageMuted: "#94A3B8"
  stageJade: "#34D399"
  stageJadeInk: "#052E16"
typography:
  sans: "Plus Jakarta Sans"
  mono: "JetBrains Mono"
  tabularNumerals: true
radius:
  card: "12px"
  well: "8px"
  pill: "9999px"
---

# DESIGN.md — Battery Passport Host (Hybrid Obsidian Telemetry & Technical Ledger)

## Overview

The Hybrid design system combines **Obsidian Dark Hardware Stages (`#0B1016`)** and **Electrochemical Jade (`#34D399`)** telemetry from Direction A with **Exposed Registration Crosshairs (`+`) & High-Contrast Specification Cards (`#FFFFFF` over `#F2F4F7`)** from Direction B and **`45°` Chamfered Hardware Badges (`clip-path`) & Industrial Cobalt (`#1D4ED8`)** from Direction C.

Every screen is engineered for fast mobile QR-scan sessions and scannable B2B technical workflows while maintaining strict AA+ contrast, 44px+ touch targets, and CSS-only motion graphics that respect `prefers-reduced-motion`.

## Color System

| Token | Hex | Role |
| :--- | :--- | :--- |
| `--ground` | `#F2F4F7` | Cool titanium-stone ledger canvas |
| `--surface` | `#FFFFFF` | High-contrast specification cards & workspace sheet |
| `--well` | `#E5E9F0` | Recessed data wells and progress tracks |
| `--well-soft` | `#EEF1F6` | Card headers and subtle inset callouts |
| `--border` | `#D5DCE6` | 1px structural card and row borders |
| `--border-strong` | `#B6C2D2` | High-emphasis card and input outlines |
| `--rule` | `#E3E8F0` | Internal `<dl>` key-value divider rules |
| `--ink` | `#0B1017` | Primary carbon ink (`18.4:1` on `#FFFFFF`) |
| `--muted` | `#4A5565` | Secondary technical labels (`7.3:1` on `#FFFFFF`) |
| `--accent` | `#1D4ED8` | Industrial cobalt primary action & active tab indicator |
| `--accent-ink` | `#1E40AF` | Darker cobalt hover and high-contrast badge ink |
| `--positive` | `#047857` | Matched / public-tier emerald status (`>= 5.4:1`) |
| `--notice-bg` | `#FEF7E6` | Warm amber notice surface |
| `--notice-border` | `#E5C168` | Amber notice border |
| `--notice-ink` | `#7C4A03` | High-contrast amber disclosure text |
| `--stage-bg` | `#0B1016` | Obsidian dark masthead, workspace rail, and hero stage |
| `--stage-surface` | `#121A23` | Recessed dark instrument cards |
| `--stage-border` | `#233242` | Dark stage structural hairline |
| `--stage-jade` | `#34D399` | Electrochemical jade CTA & live telemetry accent |
| `--stage-jade-ink` | `#052E16` | Deep forest ink over `#34D399` buttons (`11.6:1`) |

## Typography (2 Font Families via `next/font/google` with `display: "swap"`)

- **Primary UI & Display Sans (`--font-space-grotesk` -> `Plus Jakarta Sans`):** Weights `400`, `500`, `600`, `700`. Tight tracking (`-0.025em` to `-0.03em`) on headings, generous `1.6` line-height on body copy.
- **Technical Monospace (`--font-jetbrains-mono` -> `JetBrains Mono`):** Weights `400`, `500`, `600` for passport IDs, `/p/[slug]` routes, SHA-256 digests, PDF parser trace snippets, and version tags.
- **Tabular Numerals (`.num`):** `font-variant-numeric: tabular-nums` enforced across all electrical ratings, carbon metrics (`kg CO2e`), percentages, and UTC timestamps.

## Visual Motifs & Interactive Motion Graphics

1. **QR Finder Corner Brackets (`CornerBrackets`):** `2px` L-shaped corner ticks framing the hero stage, step cards, and contact panel.
2. **45° Chamfered Badges & Buttons (`.chamfer-sm`, `.chamfer-card`):** Beveled polygon corners echoing an anodized e-bike battery enclosure.
3. **Registration Crosshairs (`+`):** Monospace grid markers on section headers and specification cards.
4. **CSS-Only Motion Graphics (`globals.css`, `prefers-reduced-motion` safe):**
   - `.hero-enter` / `.hero-enter-delay-1`: Spring-eased entrance transitions (`cubic-bezier(0.16, 1, 0.3, 1)`).
   - `.qr-scan-line`: Sweeping emerald laser line over the battery casing QR code preview.
   - `.status-pulse`: Subtle pulsing live indicator dot on passport mastheads and 2.5D repair pins.
   - `.bar-fill-enter`: Smooth horizontal scale-in on carbon footprint and material mass breakdown bars.
   - `.pressable` & `.interactive-card`: Tactile hover lift (`-1px` / `-2px`) and active press (`scale(0.98)`).

## Surface Architecture Across Routes

- **`/` (Landing Page):** Obsidian dark header & hero stage housing `HeroPassportStage` (interactive 4-row Completeness Check with live PDF parser trace + animated QR code + interactive 4-tab Phone Hardware Mockup), followed by `How it works`, `Who it's for`, `PassportPreview`, `#contact`, and disclaimer footer.
- **`/p/[slug]` (Public Passport):** Obsidian dark identity masthead (`v1`, `/p/[slug]`, electrical spec pills, manufacturer disclaimer), sticky desktop tab bar, frosted dark mobile bottom bar (`min-h-[52px]` touch targets), and high-contrast specification cards. Empty `Repair` and `Supply` tabs remain hidden; restricted fields are stripped server-side.
- **`/demo` (Concept Demo):** Matches the Hybrid obsidian masthead and sticky mobile bar, featuring the dark-stage 2.5D battery cutaway with glowing SVG leader lines, animated carbon bars, supply route corridor, and `DEMO – no real verification performed` certificate.
- **`/login` & `/app/*` (Brand Workspace):** Framed-sheet architecture pairing the `#0B1016` dark obsidian navigation rail with a crisp `#FFFFFF` workspace sheet, sticky dark completeness summary bar, and dark QR download panel.
