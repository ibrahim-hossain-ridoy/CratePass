# Battery Passport Host — Design System Specification

## Surface Modes
- **Marketing (`/`) — `Persuade`**:
  - **Act 1 (`putty` `#e8e7e3`)**: Hardware Studio Hero with masked display line-rise, Image Shutter opening on the brushed aluminum QR casing macro (`casing-qr-macro.jpg`), pointer-tracked 3D tilt, interactive 3-stage pipeline switcher, and scroll-linked receding depth.
  - **Scene 1 (`obsidian` `#101214`)**: Held `100svh` Sticky Pipeline Scene (`hold: 2.2`) with a live vertical scrub spine (`scaleY`), `"Step 1 of 3"` beat counter, and 3-tier Annex XIII inspector.
  - **Act 3 (`chalk` `#ffffff`)**: Asymmetric 5/7 sticky editorial audience index with scroll-rising headings and parallaxing studio pack photography (`battery-pack-studio.jpg`).
  - **Act 3.5 (`obsidian` `#101214`)**: Word-by-word scroll-scrubbed `Ink fill` statement (`44% -> 100%` white ink) + rolling odometer figures (`71`, `50`, `21`), followed by **Scene 2 (`Opening window`)** where an inset hardware window (`clip-path: inset(14% 16% round 24px)`) opens to a full-bleed `100svh` showcase.
  - **Act 4 (`putty` `#e8e7e3`)**: Interactive 4-tab specimen preview (`Passport data`, `Interactive repair`, `Supply journey`, `Authenticity & recycling`) with clickable tabs on `/`.
  - **Act 5 & 6 (`petrol` `#0c262e` -> `#0d0f12`)**: Deep Baltic Petrol closing invitation and calm single-baseline legal footer.
- **Interactive Specifier (`/demo`) & Workspace (`/app/*`, `/login`) — `Operate`**: `framed-sheet` precision workspace architecture (`#e8e7e3` mineral frame surrounding `#ffffff` crisp sheets with `16px` sheet corners, zero rest shadows, and `#145b6e` Petrol active indicator).
- **QR Mobile Passport (`/p/[slug]`) — `Operate / Read`**: Zero-JS-heavy ultra-fast paint on mobile QR scans with pure CSS spring transitions and full-contrast mineral/chalk typography.
- **Legal (`/terms`, `/privacy`, `/disclaimer`) — `Read`**: Narrow `68ch` editorial reading column on `#f4f4f2` ground with structured headings and untouched notice hooks.

## Color Tokens
- `--ground`: `#f4f4f2` (cool neutral mineral paper)
- `--surface`: `#e8e7e3` (studio putty — matches product photography backdrop)
- `--surface-elevated`: `#ffffff` (crisp sheet fill)
- `--obsidian`: `#101214` (low-key hardware studio backdrop matching `bms-cells-obsidian.jpg`)
- `--petrol`: `#0c262e` (deep architectural slate-teal field)
- `--ink`: `#0f1114` (> 15:1 contrast on paper/putty)
- `--ink-secondary`: `#22252a` (> 11:1 full-contrast body ink)
- `--muted`: `#4b4f57` (> 6:1 captions & footnotes)
- `--accent`: `#145b6e` (Baltic Petrol primary action, > 7:1 on white)
- `--accent-ink`: `#0b3c49` (> 10:1 dark petrol ink on soft fills)
- `--accent-bright`: `#3eb8cf` (high-visibility highlight on obsidian scenes)
- `--signal-warn`: `#9a440c` (authorised-only safety warning)

## Typography
- **Display (`Bricolage Grotesque`)**: `500 / 600 / 700` with `font-optical-sizing: auto`, `-0.036em` tracking for headlines (`>= 56px` desktop).
- **UI & Running Text (`IBM Plex Sans`)**: `400 / 500 / 600` with `tabular-nums` alignment across numeric specifications. No monospace micro-labels; `IBM Plex Mono` is scoped strictly to literal `<code>` / `<pre>` technical identifiers.
- **Scale**:
  - `--step-display`: `clamp(1.9rem, 1.2rem + 2.75vw, 4.1rem)`
  - `--step-head`: `clamp(1.6rem, 1.18rem + 1.75vw, 2.75rem)`
  - `--step-lead`: `clamp(1.15rem, 1.04rem + 0.45vw, 1.4rem)`
  - `--step-body`: `clamp(1rem, 0.96rem + 0.16vw, 1.125rem)` (never below 16px body)
  - `--step-small`: `clamp(0.875rem, 0.85rem + 0.08vw, 0.9375rem)` (minimum readable text `>= 14px`)

## Motion & Choreography
- **Chapter-Aware Adaptive Header (`LandingNav.tsx`)**: Smoothly morphs background and ink in `300ms ease` across `putty`, `obsidian`, `chalk`, and `petrol` chapters, paired with a `2px` GPU `scaleX` scroll progress rail.
- **Hero Load & Receding Exit**: Masked vertical line-rise (`840ms var(--ease-expo)`), Image Shutter reveal (`clip-path: inset(0 0 100% 0) -> inset(0)` + `scale(1.09 -> 1)`), pointer-tracked 3D tilt, and scroll-linked receding depth (`yPercent: 5, scale: 0.968`).
- **Two Held Scroll Scenes + Quiet Interlude**:
  1. **Scene 1 (`PipelineScrollScene.tsx`)**: Sticky `100svh` 3-beat hardware/schema pipeline with live scrub progress spine.
  2. **Ink-Fill Interlude & Rolling Odometer Figures (`InkFillSection.tsx` + `RollingNumber.tsx`)**: Word-by-word scroll opacity scrub (`44% -> 100%`) and rolling digit columns (`71`, `50`, `21`).
  3. **Scene 2 (`Opening window` in `InkFillSection.tsx`)**: Sticky `100svh` window expanding from `inset(14% 16% round 24px)` to full-bleed `inset(0% 0% round 0px)`.
- **Cross-Document View Transitions & Reduced Motion**: Native `@view-transition { navigation: auto; }` (`180ms` leave / `340ms` arrive). `prefers-reduced-motion: reduce` disables GSAP scrubbing, Lenis smoothing, view transitions, and keyframes immediately. `/p/[slug]` imports zero animation libraries.
