# Battery Passport Host — Full Product Implementation Plan (M0–M8)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans / test-driven-development and ECC security-review / backend-patterns / postgres-patterns. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the full multi-tenant EU Digital Battery Passport hosting SaaS (`Battery Passport Host`) on Next.js App Router + Supabase + Anthropic extraction + QR publishing + Paddle billing adapter across Milestones M0–M8, pausing cleanly after M5 for owner acceptance testing.

**Architecture:** Next.js `16.4.6` App Router renders public marketing routes (`/`, `/demo`, `/terms`, `/privacy`, `/disclaimer`), public published passports (`/p/[slug]`), and the authenticated workspace (`/login`, `/app`, `/app/new`, `/app/passports/[id]`). Supabase provides Postgres with strict Row Level Security (`organizations`, `members`, `products`, `passports`, `passport_versions`, `uploads`, `audit_log`, `rate_limits`), Email/Password + Magic Link Auth via `@supabase/ssr`, and private PDF Storage (`spec-pdfs`). PDFs are validated server-side (`<= 10 MB`, `%PDF-` magic bytes), parsed in Node runtime, and structured strictly via Anthropic + `zod` (or deterministic mock when `ANTHROPIC_API_KEY` is unset) with per-org daily caps and per-user rate limiting.

**Tech Stack:** Next.js 16.4.6, React 19, TypeScript, Tailwind CSS 4, `@supabase/supabase-js`, `@supabase/ssr`, `@anthropic-ai/sdk`, `zod`, `unpdf` (serverless PDF text extraction), `qrcode`.

## Global Constraints
- Never write `"compliant"`, `"certified"`, or `"verified"` about a customer's product anywhere in product copy, schemas, or public pages. Use `"completeness check"`, `"provided by manufacturer"`, and `"not verified by us"`.
- Working field list is defined strictly in `src/config/battery-fields.ts` (~30 fields) with visible notice `"Working field list. Check against the official regulation."`.
- `/p/[slug]` MUST NOT reuse `/demo`'s fictional 2.5D SVG, hotspots, `"DEMO"` badges, or fictional entities. Repair and Supply tabs on `/p/[slug]` appear ONLY when the brand provided data in those sections (text-only for Repair); `"Authenticity"` is replaced by `"Provenance & recycling"` stamped `"Information provided by the manufacturer. Not verified by us."`.
- `ANTHROPIC_MODEL` read from `process.env.ANTHROPIC_MODEL` defaulting to `"claude-haiku-5-5"`; never hardcoded. Document `"claude-sonnet-5-5"` as the higher-accuracy option.
- Cost controls: default per-org daily extraction cap (`5/day` in config), per-user rate limit in Postgres RPC, and token usage logged into `audit_log`.
- `SUPABASE_SERVICE_ROLE_KEY` must never be imported or referenced in client components; enforce via automated test; `.env.local` must stay in `.gitignore`.
- Treat uploaded PDF text strictly as untrusted data: prompt-injection boundary wrappers, strict `zod` validation, HTTP/HTTPS-only URL checks, zero raw HTML rendering.
- Preserve existing `.agents/`, `.claude/`, `AGENTS.md`, and `GEMINI.md`. Stop after M5 with an end-to-end test checklist before proceeding to M6–M8.

## Review Focus
- Uploaded non-PDF renamed to `.pdf` or >10 MB payload: server validates `%PDF-` magic bytes and byte length before reading into extractor or storage.
- PDF containing prompt-injection strings or malformed text: extractor isolates text in XML delimiters and validates output against strict `zod` schema without trusting injected instructions.
- Public `/p/[slug]` request vs restricted fields: public route reads only `snapshot_public_fields` via public RPC/projection where `status = 'published'`; draft passports return 404.
- Unauthenticated or cross-organization `/api/*` and `/app/*` requests: rejected with `401`/`403` and isolated by RLS.
- Missing optional env vars (`ANTHROPIC_API_KEY`, Paddle keys): local build, lint, tests, and mock extraction still work cleanly with clear operator feedback.

---

## Milestones Checklist

### M0 — Housekeeping & Central Config
- [ ] Save plan (`docs/superpowers/plans/2026-11-15-full-product-m0-m8.md`), update `.gitignore` (`!.env.example`), ship `.env.example`.
- [ ] Update `src/config/site.ts` (`siteName`, `brandName`, `formUrl`, `contactEmail`, `billingEnabled` flag default `false`, extraction daily/rate caps).
- [ ] Create `src/config/battery-fields.ts` (~31 fields mapped across `Identity`, `Integrity`, `Care & Repair` + `supply` & `recycling` sub-sections + `WORKING_FIELD_LIST_NOTICE`).
- [ ] Update `ROADMAP.md` with M0–M8 milestones.
- [ ] Verify `npm test`, `npm run lint`, `npm run build` and commit M0.

### M1 — Public Site & Legal Links Polish
- [ ] Keep `/` Direction A landing page aligned with `siteConfig` (`siteName`), links to `/demo`, `/app`, `/login`, disclaimer footer, and banned-word compliance.
- [ ] Keep `/demo` unchanged.
- [ ] Verify `npm test`, `npm run lint`, `npm run build` and commit M1.

### M2 — Data Layer (Supabase Postgres Migrations + RLS)
- [ ] Write `/supabase/migrations/202611150001_initial_schema.sql` and `202611150002_storage_and_public_rpc.sql` for `organizations`, `members`, `products`, `passports`, `passport_versions`, `uploads`, `audit_log`, `rate_limits`, `check_rate_limit()` RPC, immutable version/audit triggers, strict RLS policies, private `spec-pdfs` bucket + storage policies, and `get_published_passport(text)` `SECURITY DEFINER` RPC returning public snapshot only.
- [ ] Add TypeScript helper layer (`src/lib/supabase/`, `src/lib/passport-projection.ts`) + TDD tests verifying RLS SQL invariants, restricted field stripping, and zero client import of `SUPABASE_SERVICE_ROLE_KEY`.
- [ ] Verify `npm test`, `npm run lint`, `npm run build` and commit M2.

### M3 — Auth + `/app` Dashboard
- [ ] Install `@supabase/supabase-js`, `@supabase/ssr`.
- [ ] Build `/login` (Email+Password + Magic Link), `/auth/callback`, server auth helpers (`getCurrentMemberOrg()` auto-creating 1 personal org on first sign-in), and `/app` workspace dashboard (framed-sheet Direction A layout, empty/loading/error states, `"New passport"` button, sign out).
- [ ] Audit UI with `design-taste-frontend` lint/inspect scripts.
- [ ] Verify `npm test`, `npm run lint`, `npm run build` and commit M3.

### M4 — Upload + Extract + Completeness Check (`/app/new`)
- [ ] Install `zod`, `@anthropic-ai/sdk`, `unpdf`.
- [ ] Build `src/lib/extractor/` (`schema.ts`, `prompt.ts`, `mock.ts`, `index.ts`) reading `process.env.ANTHROPIC_MODEL || "claude-haiku-5-5"`, with prompt-injection armor and strict `zod` per-field status (`found` / `missing` / `uncertain`) + `sourceSnippet`.
- [ ] Build `/api/passports/extract` enforcing auth, org membership, `%PDF-` + 10 MB validation, private storage upload, per-user Postgres rate limit, per-org daily cap (`5/day`), token usage logging in `audit_log`, draft creation in `products` + `passports`, and safe JSON errors.
- [ ] Build `/app/new` UI: drag/drop PDF intake, completeness summary counter, RED-bordered missing/uncertain inline field editors, and navigation to review/publish.
- [ ] Add extractor schema, prompt-injection delimiter, PDF validation, and rate-limit tests.
- [ ] Verify `npm test`, `npm run lint`, `npm run build` and commit M4.

### M5 — Review + Publish + QR + `/p/[slug]` (**CHECKPOINT STOP**)
- [ ] Install `qrcode` + `@types/qrcode`.
- [ ] Build `/app/passports/[id]` workspace screen (`src/app/app/passports/[id]/page.tsx`) + API routes (`/api/passports/[id]` PATCH/POST publish/unpublish/new version) with mandatory accuracy declaration checkbox (`"I confirm this information is accurate and I am responsible for it"`), immutable `passport_versions` snapshot, billing check hook (free when `BILLING_ENABLED=false` or `comp_enabled=true`), and client/server QR generator (`SVG` + `PNG` download).
- [ ] Build real `/p/[slug]` public passport reusing the `/demo` 4-tab shell layout cleanly **without** demo SVG/hotspots/DEMO labels: conditional `Repair` tab (text-only), conditional `Supply` tab, `"Provenance & recycling"` tab (`"Information provided by the manufacturer. Not verified by us."`), working field notice, and strict public-tier field projection.
- [ ] Add `/p/[slug]` projection & conditional-tab tests + run `design-taste-frontend` visual/lint inspection.
- [ ] Verify `npm test`, `npm run lint`, `npm run build`, commit M5, and **STOP** with user test checklist.

### M6 — Billing Adapter (`BILLING_ENABLED` + Paddle Sandbox) *(Deferred until "continue")*
### M7 — Draft Legal Pages (`/terms`, `/privacy`, `/disclaimer`) *(Deferred until "continue")*
### M8 — ECC Security Review, Hardening, Mobile QA (`390px`), `impeccable` Critique Pass & README *(Deferred until "continue")*
