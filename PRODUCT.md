# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Next.js (App Router), React, TypeScript, Tailwind CSS (deploy target: Vercel). Local static JSON data (`src/data/passport.json`). CSS-only transitions with `prefers-reduced-motion` support and minimal bundle dependencies for fast QR-scanned mobile loads.

## Users

- **Prospective EU e-bike and battery brand decision-makers** evaluating whether a scannable, mobile-first Digital Product Passport (DPP) prototype resonates with their product, service, and sustainability teams.
- **Secondary demo personas** (simulated during evaluation): riders scanning a battery QR code on a phone, bike shop technicians checking spare-part references, and market-surveillance reviewers inspecting grouped fields.

## Product Purpose

Deliver a fast, credible, mobile-first single-page concept demo of an EU Digital Product Passport for a fictional e-bike battery (**Demo Brand — DB-36V Battery Pack**) to validate customer interest before building backend ingestion, multi-tenant dashboards, or cryptographic infrastructure.

## Positioning

Unlike dense regulatory PDFs or generic SaaS templates, the experience presents battery identity, lifecycle carbon/material composition, safe repair boundaries, supply route provenance, and end-of-life instructions as a tactile, precision hardware manual built for phone screens first.

## Operating Context

- Opened primarily via smartphone camera QR scan in retail, workshop, or customer-discovery demo settings.
- Operates strictly offline-ready/static with zero backend, zero database, zero auth, and zero external network dependencies (aside from build-bundled fonts).

## Capabilities and Constraints

- **Fictional-only data:** Brand (`Demo Brand`), product (`DB-36V Battery Pack`), manufacturer, EU responsible person, supply facilities, addresses, and verification records must remain 100% fictional.
- **Zero compliance claims:** Must never assert legal compliance, certification, or real verification. Persistent `"Concept demo – fictional data"` badge visible across all tabs; Authenticity values explicitly labeled `"DEMO – no real verification performed"`.
- **Repair safety boundary:** Only external `Fuse` and `Latch` hotspots provide user-level repair steps. Internal `Cell Pack` and `BMS Board` hotspots strictly display `"Authorised service only – do not open the pack"` with spare-part placeholders and zero DIY disassembly steps.
- **Access tier indicators:** Tab 1 field groups display visual-only `"Public"` or `"Restricted (authorities/repairers)"` tags without gating logic in Slice 1.

## Brand Commitments

- **Direction A — Braun / Teenage Engineering Technical Manual (Light):** Warm alabaster paper ground (`#F5F4F0`), crisp light cards (`#FFFFFF` / `#FAF9F6`), matte charcoal ink (`#141413`), safety-orange (`#EA580C` / `#C2410C` text) and forest-green (`#15803D`) accents, paired with `Space Grotesk` and `JetBrains Mono`.
- Fixed bottom tab navigation on mobile (`< 768px`).

## Evidence on Hand

- Slice 1 operates entirely from static fictional JSON (`src/data/passport.json`). No live customer telemetry, real laboratory test reports, or active cryptographic verification endpoints exist yet.

## Product Principles

1. **QR-Scan Speed First:** Minimal JS bundle, inline crisp SVGs, CSS-only motion, instant first render on mobile networks.
2. **Honest Demo Boundaries:** Clearly distinguish illustrative/fictional demo state from real verification or legal compliance at every point.
3. **Safety Over Completeness:** Never instruct end users to open a high-energy lithium battery enclosure.
4. **Hardware-Grade Clarity:** Align every specification, unit, percentage sum, and component callout with precision engineering discipline.
