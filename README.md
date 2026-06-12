# AdsIQ — Amazon Ads + Sales Intelligence Platform

A production-ready MVP of a multi-client SaaS dashboard for agencies and brands. It
connects **Amazon Advertising API** and **Amazon Selling Partner API (SP-API)**
data, normalizes it into **PostgreSQL**, provides analytics dashboards, an
**SQP analyzer**, and an **AI co-pilot powered by Claude** that answers questions
strictly from each client's live data.

The app ships with a full database-backed structure and realistic **mock seed
data** so it works end-to-end today, and is structured so real Amazon APIs can be
dropped in without touching the UI or analytics layers.

---

## Tech stack

- **TypeScript**, **Next.js (App Router)**, **React**
- **Tailwind CSS** + **shadcn/ui**–style components
- **Node.js** route handlers (API)
- **PostgreSQL** + **Prisma ORM**
- **Anthropic Claude API** (streaming co-pilot, audits, plans, reports)
- **Redis / BullMQ** for background jobs + **cron** scheduled syncs
- Vercel-ready (`vercel.json` cron included)

---

## Quick start

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env
#   - set DATABASE_URL (PostgreSQL)
#   - optionally set ANTHROPIC_API_KEY for full AI (otherwise demo mode)

# 3. Create the schema and seed mock data
npm run prisma:push      # push schema to the database
npm run db:seed          # seed demo workspace + 5 clients with metrics

# 4. Run the app
npm run dev              # http://localhost:3000
```

Demo login (for reference): `demo@adsiq.app` / `demo1234`.

> The app works **without** any API keys or Redis. With no `ANTHROPIC_API_KEY`
> the AI co-pilot/audit/report features run a deterministic, data-grounded
> fallback. With no `ENABLE_QUEUE=true` syncs run inline (no worker needed).

---

## Environment variables

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | PostgreSQL connection string |
| `REDIS_URL` | Redis for BullMQ (optional) |
| `ENABLE_QUEUE` | `"true"` to process syncs via BullMQ worker; otherwise inline |
| `ANTHROPIC_API_KEY` | Claude API key (optional; enables real AI) |
| `ANTHROPIC_MODEL` | Claude model (default `claude-3-5-sonnet-latest`) |
| `AMAZON_ADS_CLIENT_ID/SECRET/REDIRECT_URI` | Amazon Advertising OAuth |
| `AMAZON_SP_API_CLIENT_ID/SECRET` / `AMAZON_REFRESH_TOKEN` | SP-API |
| `TOKEN_ENCRYPTION_KEY` | 64-hex-char key to encrypt stored OAuth tokens |
| `CRON_SECRET` | Optional bearer token for `/api/cron/sync` |

No credentials are ever hardcoded.

---

## Project structure

```
app/
  (app)/                     # authenticated app shell (sidebar layout)
    dashboard/               # portfolio overview (all clients)
    clients/                 # client list + create
      [id]/dashboard         # client analytics dashboard
      [id]/sqp               # Search Query Performance analyzer
      [id]/chat              # AI co-pilot (streaming)
      [id]/audit             # Connect → Audit → Marketing Plan workflow
      [id]/reports           # client report generator
      [id]/settings          # connections + sync history
    connect/amazon           # Amazon OAuth connect flow
  api/
    chat/                    # streaming Claude endpoint
    clients/[id]/sync        # manual sync + job status
    clients/[id]/audit       # run audit
    clients/[id]/marketing-plan
    clients/[id]/report
    amazon/connect|callback  # OAuth placeholder + redirect callback
    cron/sync                # daily scheduled sync entrypoint
components/
  ui/                        # shadcn-style primitives
  dashboard/ charts/ tables/ chat/ layout/ states/ ...
lib/
  amazon/                    # ads-api, sp-api, brand-analytics, oauth, sync, mock
  anthropic/                 # client, prompts, context, chat (streaming)
  analytics/                 # metrics, service (DB queries), insights, date-ranges
  sqp/                       # SQP analyzer (join + classify)
  reports/                   # audit, marketing-plan, report generators
  queue/                     # BullMQ queue, worker, inline fallback, runner
  db/                        # Prisma client singleton
prisma/
  schema.prisma              # full data model
  seed.ts                    # realistic mock seed
```

---

## Core features

### Multi-tenant
`User → Workspace → WorkspaceMember (OWNER/ADMIN/ANALYST/VIEWER) → Client`.
Each client tracks brand, marketplace, Amazon connections, sync status and last
sync date. (Session auth is stubbed via a demo workspace resolver — see
`lib/workspace.ts` — and is the single place to wire in real auth.)

### Analytics dashboards
Spend, sales, revenue, TACOS, ACOS, ROAS, impressions, clicks, CTR, CPC, CVR,
orders — each with period-over-period comparison (7/30/90-day presets + custom
range). Trend charts, campaign/product/search-term tables, client switcher.

All KPIs are computed from raw additive totals in `lib/analytics/metrics.ts`, so
ratios stay correct at any aggregation grain.

### Amazon integration layer
`lib/amazon/*` contains typed clients for the Advertising API, SP-API and Brand
Analytics, an encrypted-token OAuth flow, and a sync orchestrator exposing
`syncCampaigns`, `syncAdGroups`, `syncKeywords`, `syncSearchTerms`,
`syncProducts`, `syncSalesMetrics`, `syncSQPData` and `normalizeMetrics`. When
credentials are absent these hydrate the same tables from a deterministic mock
generator, so swapping in live data requires no UI changes.

### Background syncs
BullMQ queue + worker (`npm run worker`) with job lifecycle
(pending/running/completed/failed), logs, retries and a daily cron
(`/api/cron/sync`, wired in `vercel.json`). Falls back to inline execution when
the queue is disabled.

### AI co-pilot (Claude)
Streaming chat grounded **only** in the client's data via
`getClientContext()`. Strong system prompt forbids hallucination and requires the
model to flag missing data. Helper context builders cover performance summaries,
SQP insights, wasted spend and scaling opportunities.

### Connect → Audit → Marketing Plan → Report
A deterministic analytics engine surfaces wasted spend, high-ACOS campaigns,
low-CTR keywords, strong campaigns, SQP opportunities and product conversion
issues; Claude (when configured) writes the narrative audit, 30-day marketing
plan and client-facing report. Everything is persisted (`AuditReport`,
`MarketingPlan`).

### SQP analyzer
Joins Search Query Performance shares (impression/click/cart-add/purchase) with
PPC performance and classifies every query into **Scale / Cut / Test / Defend /
Maintain** with a reason and priority (`lib/sqp/analyzer.ts`).

---

## Scripts

| Script | Description |
| --- | --- |
| `npm run dev` | Start Next.js dev server |
| `npm run build` | `prisma generate` + production build |
| `npm run start` | Start production server |
| `npm run typecheck` | TypeScript check |
| `npm run prisma:push` | Push schema to the database |
| `npm run db:seed` | Seed demo data |
| `npm run worker` | Start the BullMQ sync worker |

---

## Moving to FastAPI later

Business logic lives in framework-agnostic modules under `lib/` (analytics,
amazon, sqp, reports, queue). API routes are thin adapters. To migrate the
backend to FastAPI, port those modules and keep the Prisma schema as the
contract; the Next.js frontend can then call the new API.
