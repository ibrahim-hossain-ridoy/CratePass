# CratePass

**EU Digital Battery Passport hosting and completeness-check infrastructure** for e-bike/LMT, EV, and industrial (>2 kWh) battery brands and importers—plus Simple QR compliance labels for portable, SLI, and ≤2 kWh batteries under Regulation (EU) 2023/1542.

Upload a manufacturer specification PDF (or start from a blank draft), collect missing upstream factory data via a zero-login 5-language Supplier Magic Link, serialize units in bulk via CSV with GS1 Digital Link QR label sheets, and publish immutable, multi-language public passports with strict 3-tier access isolation.

> **Disclaimer:** CratePass provides technical hosting and completeness-check infrastructure, not legal advice or compliance certification. CratePass is not a Notified Body. Economic operators remain solely responsible for verifying declared data against the official EU Battery Regulation (EU) 2023/1542 text.

---

## Key Features

- **71-Point EU Annex XIII Schema (`src/config/battery-fields.ts`):** Separates **50 static** PDF-extractable fields from **21 dynamic BMS** telemetry fields across `LMT`, `EV`, and `Industrial` categories, plus one private `additional_information` field.
- **Strict 3-Tier Access Control:** Enforces `public`, `legitimate_interest`, and `authorities_only` visibility via Supabase Row Level Security (RLS) and `passport-projection.ts`. Public routes and JSON-LD exports never expose restricted or draft data.
- **Multi-Provider AI PDF Extraction (`Anthropic → Gemini → Mock`):** Prompt-injection-hardened (`<untrusted_datasheet_text>`) extraction with verbatim `sourceSnippet` attribution and strict `zod` validation. Automatically routes through `ANTHROPIC_API_KEY`, falls back to `GEMINI_API_KEY` (`gemini-2.5-flash`), or runs a deterministic local mock extractor when both keys are blank.
- **5-Language No-Login Supplier Magic Link (`/supplier/[token]`):** Shareable, hashed, expiring links allowing upstream factories to submit missing fields and test PDFs in **English, Simplified Chinese (`简体中文`), Korean (`한국어`), Japanese (`日本語`), or Vietnamese (`Tiếng Việt`)** without creating an account, with owner diff-and-merge approval.
- **Model-to-Unit Bulk CSV Serialization & Print-Ready QR Sheets:** Import unit serial numbers, GTINs, and batch lots via CSV to generate item-level `/p/[slug]/u/[serial]` and **GS1 Digital Link** (`/01/[gtin]/21/[serial]`) routes, plus printable A4 QR label PDF sheets and SVG/PNG exports.
- **EU DPP Registry JSON-LD & Audit Data Package PDF:** Machine-readable `/p/[slug]/passport.jsonld` (public-tier only, with SHA-256 snapshot hash) and printable completeness summary PDFs.
- **7-Language Public Passport Switcher:** Instant switching across **EN, DE, FR, NL, ES, IT, and PL** on public `/p/[slug]` pages.
- **Simple QR Mode (Article 13(6)):** Lightweight compliance records for portable, SLI, and industrial ≤2 kWh batteries linking directly to the EU Declaration of Conformity PDF and disposal instructions.
- **Dealer / Repairer Service Portal (`/service/[slug]`) & REST API:** PIN-gated workshop portal and workspace API keys (`POST /api/v1/passports/[id]/dynamic`) for append-only dynamic BMS State of Health (SoH) and lifecycle status logs without mutating immutable static snapshots.
- **Public Eligibility Checker (`/checker`):** Zero-login 4-question wizard helping EU importers identify applicable 18 February 2027 and 18 August 2027 obligations.
- **Custom Branding & Subdomains (`/app/settings/branding`):** Workspace logo upload (with magic-byte and SVG XSS validation), custom accent color, and CNAME custom-domain routing.

---

## Tech Stack

- **Framework:** Next.js (App Router, TypeScript) + Tailwind CSS, deployed on Vercel
- **Database, Auth & Storage:** Supabase Postgres (with RLS & immutability triggers), Supabase Auth, and private/public storage buckets
- **AI Extraction:** Anthropic SDK (`claude-haiku-5-5` / `claude-sonnet-5-5`) & Google Gemini REST API (`gemini-2.5-flash`) with deterministic mock fallback
- **Billing:** Paddle Merchant of Record adapter (`src/config/plans.ts`, Free: up to 3 live passports / 25 serialized units; Pro: €79/month or annual billing)

---

## Environment Setup

Copy `.env.example` to `.env.local` (gitignored):

```bash
cp .env.example .env.local
```

Configure the environment variables below in `.env.local` and in **Vercel → Project Settings → Environment Variables**:

| Variable | Required | Purpose |
| --- | --- | --- |
| `NEXT_PUBLIC_SITE_URL` | Yes | Canonical base URL embedded in QR codes and links (e.g. `http://localhost:3000` or your Vercel domain) |
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase public anonymous key |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only | Used strictly server-side for rate limiting, storage, public RPCs, and webhooks (never exposed to client bundles) |
| `ANTHROPIC_API_KEY` | Optional | Primary AI PDF extractor (Claude); leave blank to fall through to Gemini |
| `ANTHROPIC_MODEL` | Optional | Defaults to `claude-haiku-5-5` |
| `GEMINI_API_KEY` | Optional | Free-tier or paid Google AI Studio key used when `ANTHROPIC_API_KEY` is blank |
| `GEMINI_MODEL` | Optional | Defaults to `gemini-2.5-flash` |
| `BILLING_ENABLED` | Optional | `false` for local dev / pre-billing launch; `true` once live Paddle credentials are configured |
| `PADDLE_ENV` | Optional | `sandbox` or `production` |
| `PADDLE_API_KEY` | When billing enabled | Server-side Paddle API key |
| `PADDLE_WEBHOOK_SECRET` | When billing enabled | HMAC-SHA256 secret for `/api/webhooks/paddle` (fails closed when enabled) |
| `NEXT_PUBLIC_PADDLE_CLIENT_TOKEN` | When billing enabled | Client-side Paddle checkout token |
| `NEXT_PUBLIC_PADDLE_PRICE_ID` | When billing enabled | Paddle Pro subscription price ID |

---

## Database Migrations & Supabase Auth

1. Run all **9 SQL migrations** in exact chronological order inside the **Supabase SQL Editor** from `supabase/migrations/`:
   1. `202611150001_initial_schema.sql`
   2. `202611150002_storage_and_public_rpc.sql`
   3. `202611160003_three_tier_and_category.sql`
   4. `202611190004_allow_cascade_passport_delete.sql`
   5. `202611200001_supplier_magic_links.sql`
   6. `202611200002_passport_units_serialization.sql`
   7. `202611200003_simple_qr_and_branding.sql`
   8. `202611200004_service_portal_and_dynamic_logs.sql`
   9. `202611200005_supplier_multilang_locales.sql`
2. In **Supabase → Authentication → URL Configuration**, set your **Site URL** and add your `/auth/callback` route to **Redirect URLs**:
   - Local: `http://localhost:3000/auth/callback`
   - Production: `https://<your-domain>/auth/callback`

---

## Local Development & Verification

```bash
npm install
npm run dev
```

Run the full verification suite before deploying:

```bash
npx tsc --noEmit
npm run lint
npm test
npm run build
```

---

## Public Legal & Compliance Routes

All customer-facing legal and pricing pages are publicly accessible without login and linked from the site footer:

- `/pricing` — Plan comparison (Free vs. Pro)
- `/terms` — B2B Terms of Service & non-certifier disclaimer
- `/privacy` — Privacy Policy, subprocessors, and GDPR data export/deletion
- `/refund` — Paddle Merchant of Record cancellation & 14-day refund policy
