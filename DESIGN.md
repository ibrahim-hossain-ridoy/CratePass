# Battery Passport Host — Design System Specification

## Surface Modes
- **Marketing (`/`) — `Persuade`**: Mineral Putty (`#eae7e0`) hardware studio opening chapter, Deep Obsidian (`#101214`) interactive telemetry pinned stage, Crisp Chalk (`#ffffff`) asymmetric audience index, Putty (`#eae7e0`) embedded specimen preview, and Baltic Petrol (`#0c262e`) closing invitation. Zero static card boxes or cream/terracotta tells.
- **Interactive Specifier (`/demo`) & Workspace (`/app/*`, `/login`) — `Operate`**: `framed-sheet` precision workspace architecture (`#eae7e0` mineral frame surrounding `#ffffff` crisp sheets with `16px` sheet corners, zero rest shadows, and `#145b6e` Petrol active indicator).
- **QR Mobile Passport (`/p/[slug]`) — `Operate / Read`**: Zero-JS-heavy ultra-fast paint on mobile QR scans with pure CSS spring transitions and full-contrast mineral/chalk typography.
- **Legal (`/terms`, `/privacy`, `/disclaimer`) — `Read`**: Narrow `68ch` editorial reading column on `#f3f1ed` ground with structured headings and untouched notice hooks.

## Color Tokens
- `--ground`: `#f3f1ed` (low-chroma mineral paper)
- `--surface`: `#eae7e0` (studio putty — matches product photography seamless backdrop)
- `--surface-elevated`: `#ffffff` (crisp sheet fill)
- `--obsidian`: `#101214` (low-key hardware studio backdrop matching `bms-cells-obsidian.jpg`)
- `--petrol`: `#0c262e` (deep architectural slate-teal field)
- `--ink`: `#0f1114` (> 15:1 contrast on paper/putty)
- `--ink-secondary`: `#2e3238` (> 9.5:1 full-contrast body ink)
- `--muted`: `#555961` (> 5.5:1 captions & footnotes)
- `--accent`: `#145b6e` (Baltic Petrol primary action, > 6.8:1 on white)
- `--accent-bright`: `#3eb8cf` (high-visibility highlight on obsidian scenes)
- `--signal-warn`: `#9a440c` (authorised-only safety warning)

## Typography
- **Display (`Bricolage Grotesque`)**: `500 / 600 / 700` with `font-optical-sizing: auto`, `-0.036em` tracking for headlines (`>= 56px` desktop).
- **UI & Running Text (`IBM Plex Sans`)**: `400 / 500 / 600` with `tabular-nums` alignment across numeric specifications. No monospace micro-labels; `IBM Plex Mono` is scoped strictly to literal `<code>` / `<pre>` technical identifiers.
- **Scale**:
  - `--step-display`: `clamp(1.9rem, 1.25rem + 2.75vw, 4.1rem)`
  - `--step-head`: `clamp(1.6rem, 1.2rem + 1.75vw, 2.75rem)`
  - `--step-lead`: `clamp(1.15rem, 1.04rem + 0.48vw, 1.4rem)`
  - `--step-body`: `clamp(1rem, 0.96rem + 0.16vw, 1.125rem)` (never below 16px body)
  - `--step-small`: `clamp(0.875rem, 0.85rem + 0.08vw, 0.9375rem)` (minimum readable text `>= 14px`)

## Motion & Choreography
- **Hero Load**: Masked vertical line-rise on display headline (`820ms cubic-bezier(0.22, 1, 0.36, 1)`) staggered by `90ms`, followed by pointer-tracked 3D hardware studio tilt (`@media (hover: hover)`) and live 3-step PDF-to-QR telemetry switcher.
- **Scroll Choreography (GSAP + ScrollTrigger + Lenis)**:
  - Held sticky `100svh` pipeline stage (`bg-[#101214]`) scrubbing through OEM PDF extraction -> 71-point Annex XIII completeness diff -> casing QR print pack.
  - Scroll-parallax hardware studio photography and staggered asymmetric list reveals (`transform` + `opacity` + `clip-path` only).
- **Reduced Motion & Mobile QR Budget**: `prefers-reduced-motion: reduce` disables GSAP scrubbing, Lenis smoothing, and infinite keyframes immediately, presenting every section in its clean completed state. `/p/[slug]` imports zero animation libraries.
