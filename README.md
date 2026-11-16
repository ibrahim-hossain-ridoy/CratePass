# Battery Passport Host

Technical hosting infrastructure for EU Digital Battery Passports targeting e-bike and light-EV (LMT) battery brands: upload a manufacturer specification PDF, review missing/uncertain fields in a completeness check, approve a responsibility declaration, publish a mobile-first QR passport at `/p/[slug]`, and download SVG/PNG QR codes.

> **Disclaimer:** Not legal advice. We provide technical hosting infrastructure, not compliance certification. Field schemas reflect a working editable list (`Working field list. Check against the official regulation.`) inspired by Regulation (EU) 2023/1542 Annex XIII.

---

## Core Architecture

- **Framework:** Next.js App Router (TypeScript) + Tailwind CSS, built for Vercel.
- **Database, Auth & Private Storage:** Supabase Postgres with Row Level Security (`supabase/migrations/`), Email + Password & Magic Link login, and a private `spec-pdfs` bucket (10 MB PDF ceiling).
- **PDF Parsing & Extraction:** Server-side `%PDF-` magic-byte check + `unpdf` text extraction, isolated inside `<untrusted_datasheet_text>` prompt delimiters and validated strictly with `zod`.
  - Reads `ANTHROPIC_MODEL` from env (default: `claude-haiku-5-5`; set `claude-sonnet-5-5` for higher-accuracy extraction).
  - Falls back to a deterministic local extractor when `ANTHROPIC_API_KEY` is blank so local runs always work.
- **Cost & Abuse Guardrails:** Per-organization daily cap (`5` extractions/UTC day in `src/config/site.ts`), per-user sliding-window rate limiting (`check_rate_limit` Postgres RPC), token-usage audit logging (`audit_log`), and zero third-party tracking analytics by default.
- **Public Passports (`/p/[slug]`):** Reads only `published` snapshots containing `public`-tier fields (`restricted` technical fields never leave the workspace/database RPC). Conditional **Care & repair info** (text-only, no fictional hotspots) and **Supply notes** tabs hide automatically when empty, alongside **Provenance & recycling** labeled `"Information provided by the manufacturer. Not verified by us."`.
- **Concept Demo (`/demo`):** Separate standalone fictional concept showcase (`DB-36V Battery Pack` / `Demo Brand`) kept cleanly isolated from customer passports.

---

## Environment Setup

Copy `.env.example` to `.env.local` (already gitignored):

```bash
cp .env.example .env.local
```

Configure the keys below in `.env.local` (and in Vercel Project Settings -> Environment Variables):

| Variable | Required | Purpose |
| --- | --- | --- |
| `NEXT_PUBLIC_SITE_URL` | Yes | Base URL used when embedding `/p/[slug]` targets in QR codes (e.g. `http://localhost:3000` or your Vercel domain) |
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase anonymous public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only | Used strictly server-side for rate limiting, storage, and signed billing webhooks; tested to never appear in client components |
| `ANTHROPIC_API_KEY` | Optional | Enables Claude extraction; omit to run the deterministic mock extractor locally |
| `ANTHROPIC_MODEL` | Optional | Defaults to `claude-haiku-5-5`; set `claude-sonnet-5-5` for higher accuracy |
| `BILLING_ENABLED` | Optional | Set `false` (default) for free pilot publishing; set `true` to enforce active subscriptions or org `comp_enabled` bypass |
| `PADDLE_ENV` | Optional | `sandbox` (default) or `production` |
| `PADDLE_API_KEY` | When billing enabled | Server-side Paddle API key for `/api/billing/checkout` |
| `PADDLE_WEBHOOK_SECRET` | When billing enabled | Used for HMAC-SHA256 verification on `/api/webhooks/paddle` |
| `NEXT_PUBLIC_PADDLE_CLIENT_TOKEN` | Optional | Paddle client token placeholder |
| `NEXT_PUBLIC_PADDLE_PRICE_ID` | When billing enabled | Paddle subscription price ID (placeholder EUR pricing in `src/config/site.ts`) |

---

## Database Migrations & Auth Configuration

1. In the **Supabase SQL Editor**, execute both migrations in order from `supabase/migrations/`:
   1. `supabase/migrations/202611150001_initial_schema.sql` (tables, indexes, immutability triggers on `passport_versions` and `audit_log`, strict RLS policies)
   2. `supabase/migrations/202611150002_storage_and_public_rpc.sql` (private `spec-pdfs` bucket, `ensure_personal_org`, `get_published_passport`, `check_rate_limit`, `get_org_daily_extraction_count`)
2. In **Supabase Authentication -> URL Configuration**, add your `/auth/callback` route to **Redirect URLs**:
   - Local: `http://localhost:3000/auth/callback`
   - Production: `https://your-domain.com/auth/callback`
3. Optional pilot bypass: grant free publishing to an organization when `BILLING_ENABLED=true` by updating `comp_enabled = true` on its row in `public.organizations` via SQL/admin.

---

## Customizing Configuration & Working Field List

- **Brand, Contact & Cost Controls:** Edit [`src/config/site.ts`](src/config/site.ts) (`siteName`, `formUrl`, `contactEmail`, `dailyExtractionLimitPerOrg`, `billingPlan` EUR placeholder pricing).
- **Battery Schema (~31 fields):** Edit [`src/config/battery-fields.ts`](src/config/battery-fields.ts) to add, rename, mark required/optional, or adjust `public` vs `restricted` visibility per field without altering extractor or projection code.

---

## Legal & GDPR Drafts (Pre-Launch Review)

Public legal draft pages live at `/terms`, `/privacy`, and `/disclaimer`, with workspace GDPR JSON export (`/api/org/export`) and unpublished-draft deletion (`/app/privacy`). All three public documents carry a visible **`TODO: lawyer review`** notice and must be reviewed by qualified EU legal counsel prior to production launch.

---

## Local Development & Verification

```bash
npm install
npm run dev
```

Verification suite:

```bash
npm test
npm run lint
npx tsc --noEmit
npm run build
```
