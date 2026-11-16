# Roadmap — Battery Passport Host

**Battery Passport Host** (working title) is technical hosting infrastructure for EU e-bike and light-EV (LMT) battery brands: upload a datasheet PDF, inspect a structured completeness check (`found` / `missing` / `uncertain`), complete missing fields, approve a manufacturer declaration, and publish a mobile-first QR passport page at `/p/[slug]`.

> **Disclaimer:** Not legal advice. We provide technical hosting infrastructure, not compliance certification. Field schemas reflect a working editable field list inspired by Regulation (EU) 2023/1542 Annex XIII — always verify against the official regulation.

---

## Milestones

- **M0 — Housekeeping & Central Config *(Done)***
  - Repository configuration, `.gitignore` + `.env.example`, centralized [src/config/site.ts](src/config/site.ts) (`siteName`, contact placeholders, `BILLING_ENABLED=false` flag, cost/rate caps), and editable ~30-field [src/config/battery-fields.ts](src/config/battery-fields.ts).
- **M1 — Public Site & Fictional Concept Demo *(Done)***
  - `/` Direction A landing page (`EU Battery Passport from your spec PDF`, 3-step workflow, completeness check card, live `/demo` preview, `#contact`, disclaimer footer) and `/demo` static fictional 4-tab demo.
- **M2 — Supabase Schema & Row Level Security *(Done)***
  - SQL migrations in `/supabase/migrations` for `organizations`, `members`, `products`, `passports`, `passport_versions` (immutable snapshots), `uploads`, `audit_log`, `rate_limits`, private `spec-pdfs` bucket, and public-tier RPC for `/p/[slug]`.
- **M3 — Auth + `/app` Brand Workspace *(Done)***
  - Email + password and Magic Link authentication via `@supabase/ssr`, automatic 1-org onboarding, mobile-first `/app` dashboard with empty/loading/error states.
- **M4 — PDF Upload, Extractor & Completeness Check (`/app/new`) *(Done)***
  - Server-side `%PDF-` + 10 MB validation, private storage upload, prompt-injection-hardened Anthropic extractor (`ANTHROPIC_MODEL`, mock fallback when unset) validated with `zod`, per-org daily cap (`5/day`), per-user rate limit, token usage audit log, and red missing/uncertain inline boxes.
- **M5 — Review, Publish, QR & Public `/p/[slug]` *(Done · Checkpoint)***
  - Accuracy declaration checkbox, immutable `passport_versions`, SVG + PNG QR downloads, unpublish + new-version flow, and public `/p/[slug]` without fictional demo SVGs/hotspots (`Repair` and `Supply` tabs conditional, `Provenance & recycling` disclaimer).
- **M6 — Billing Adapter (`BILLING_ENABLED` + Paddle Sandbox) *(Done)***
  - `BillingProvider` interface, Paddle sandbox checkout + HMAC webhook handler, per-org `comp_enabled` override, `/app/billing` plan status UI, and placeholder EUR pricing.
- **M7 — Draft Legal Pages (`/terms`, `/privacy`, `/disclaimer`)** *(After checkpoint)*
  - Clearly marked `TODO: lawyer review` draft documents with EU customer data-processing notes.
- **M8 — Security Hardening, QA & Documentation** *(After checkpoint)*
  - ECC security audit, automated schema/RLS/client-secret/banned-words tests, `390px` mobile QA, `impeccable` critique pass, and full deployment `README.md`.

---

## TODO before deploy
- [ ] Configure `.env.local` (locally) and Vercel Environment Variables from `.env.example` (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `ANTHROPIC_API_KEY`, `ANTHROPIC_MODEL`, `NEXT_PUBLIC_SITE_URL`).
- [ ] Replace `formUrl` (`https://example.com/spec-form`) and `contactEmail` (`hello@example.com`) in `src/config/site.ts`.
- [ ] Review legal drafts with counsel before launching `/terms`, `/privacy`, and `/disclaimer`.
- [ ] Enable `BILLING_ENABLED=true` and add Paddle Sandbox/Production secrets when ready to charge beyond pilot orgs.
