---
impeccable:design-schema: 1
mode: operate
surface: apple-warm-stone-espresso-telemetry
palette:
  ground: "#F5F3EE"
  surface: "#FFFFFF"
  well: "#EAE6DE"
  wellSoft: "#F9F7F3"
  border: "#DDD7CC"
  borderStrong: "#C6BEB1"
  rule: "#E6E1D8"
  ink: "#161412"
  muted: "#625B53"
  accent: "#C2410C"
  accentInk: "#9A3412"
  accentVivid: "#EA580C"
  accentSoft: "#FFF4ED"
  accentBorder: "#FDBA8C"
  positive: "#15803D"
  positiveBg: "#F0FDF4"
  positiveBorder: "#BBF7D0"
  noticeBg: "#FEF8EC"
  noticeBorder: "#E6BF62"
  noticeInk: "#78350F"
  stageBg: "#141210"
  stageSurface: "#1D1A17"
  stageBorder: "#332E28"
  stageInk: "#F7F5F0"
  stageMuted: "#A69E94"
  stageAmber: "#F97316"
  stageJade: "#34D399"
  stageJadeInk: "#052E16"
typography:
  sans: "Plus Jakarta Sans"
  mono: "JetBrains Mono"
  tabularNumerals: true
radius:
  card: "14px"
  well: "10px"
  pill: "9999px"
---

# DESIGN.md — Battery Passport Host (Apple-Inspired Warm Stone, Deep Espresso & Burnt-Amber Telemetry)

## Overview

The design system pairs **Warm Stone & Alabaster Ledger Surfaces (`#F5F3EE` / `#FFFFFF`)** with **Deep Espresso Hardware Enclosures (`#141210`)**, **Burnt-Amber Industrial Accents (`#C2410C` / `#F97316`)**, and **Electrochemical Forest Emerald (`#15803D` / `#34D399`)** status signals.

Every screen is engineered for fast mobile QR-scan sessions and scannable B2B technical workflows while maintaining strict AA+ contrast, 44px+ touch targets, GPU-composited `transform`/`opacity` animations, and full `prefers-reduced-motion` support.

## Color System

| Token | Hex | Role |
| :--- | :--- | :--- |
| `--ground` | `#F5F3EE` | Warm stone / alabaster ledger canvas |
| `--surface` | `#FFFFFF` | High-contrast specification cards & workspace sheet |
| `--well` | `#EAE6DE` | Recessed warm stone wells and progress tracks |
| `--well-soft` | `#F9F7F3` | Card headers and subtle inset callouts |
| `--border` | `#DDD7CC` | 1px precision card and row borders |
| `--border-strong` | `#C6BEB1` | High-emphasis card and input outlines |
| `--rule` | `#E6E1D8` | Internal `<dl>` key-value divider rules |
| `--ink` | `#161412` | Primary deep espresso ink (`17.8:1` on `#FFFFFF`) |
| `--muted` | `#625B53` | Warm stone-taupe technical labels (`6.2:1` on `#FFFFFF`) |
| `--accent` | `#C2410C` | Burnt-amber primary action & active tab indicator |
| `--accent-ink` | `#9A3412` | Deep burnt sienna hover & high-contrast badge ink |
| `--positive` | `#15803D` | Matched / public-tier forest emerald status (`>= 5.1:1`) |
| `--notice-bg` | `#FEF8EC` | Warm amber notice surface |
| `--notice-border` | `#E6BF62` | Amber notice border |
| `--notice-ink` | `#78350F` | High-contrast amber disclosure text |
| `--stage-bg` | `#141210` | Deep espresso masthead, workspace rail, and 3D hero stage |
| `--stage-surface` | `#1D1A17` | Elevated dark espresso instrument cards |
| `--stage-border` | `#332E28` | Warm bronze-espresso structural hairline |
| `--stage-amber` | `#F97316` | Luminous burnt-amber CTA & live pipeline highlight |
| `--stage-jade` | `#34D399` | Live emerald telemetry indicator |

## Typography & Fluid Scales

- **Primary UI & Display Sans (`--font-space-grotesk` -> `Plus Jakarta Sans`):** Weights `400`, `500`, `600`, `700`. Fluid responsive scales (`.text-display-hero`, `.text-display-section`, `.text-title-page`) with optical sizing and tight negative tracking (`-0.022em` to `-0.032em`).
- **Technical Monospace (`--font-jetbrains-mono` -> `JetBrains Mono`):** Weights `400`, `500`, `600` for passport IDs, `/p/[slug]` routes, SHA-256 digests, PDF parser traces, and version tags.
- **Tabular Numerals (`.num`):** `font-variant-numeric: tabular-nums` enforced across all electrical ratings, carbon metrics (`kg CO2e`), percentages, and UTC timestamps.

## Motion & Micro-Interactions (`globals.css`, `prefers-reduced-motion` safe)

- **Easing Tokens:** `--ease-out: cubic-bezier(0.23, 1, 0.32, 1)`, `--ease-in-out: cubic-bezier(0.77, 0, 0.175, 1)`, `--ease-drawer: cubic-bezier(0.32, 0.72, 0, 1)`, `--ease-spring: cubic-bezier(0.16, 1, 0.3, 1)`.
- **Ref-Driven 3D Tilt Stage:** Pointer-tracked `rotateX` / `rotateY` via `requestAnimationFrame` writing directly to `ref.current.style.transform` with zero React re-renders per frame (`HeroPassportStage` & `RepairViewTab`).
- **Sliding Active Indicators (`.sliding-pill`):** Composite `transform: translateX(...)` underline and segmented-control pills across `/`, `/demo`, `/p/[slug]`, `/login`, and `/app/passports/[id]`.
- **Smooth Progress Bars (`.progress-fill-smooth`):** Composite `transform: scaleX(...)` progress fills across 71-point field groups and quota bars.
