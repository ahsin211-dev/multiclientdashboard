# Amazon Ads + Sales Intelligence MVP

Production-ready MVP scaffold for a multi-tenant SaaS platform that unifies Amazon Advertising + SP-API data, analytics dashboards, AI strategy copiloting, audit workflows, and queue-driven sync orchestration.

## Tech Stack

- TypeScript
- Next.js (App Router)
- React
- Tailwind CSS
- shadcn/ui-style components
- PostgreSQL + Prisma ORM
- Anthropic Claude API (streaming route)
- Redis + BullMQ queue abstraction

## Features Implemented

### Multi-tenant architecture

- Workspace + role-based membership (`OWNER`, `ADMIN`, `ANALYST`, `VIEWER`)
- Multiple clients per workspace
- Client-level Amazon connection metadata, sync status, and last sync date

### Database models

Prisma models included:

- `User`
- `Workspace`
- `WorkspaceMember`
- `Client`
- `AmazonConnection`
- `AdAccount`
- `Campaign`
- `AdGroup`
- `Keyword`
- `SearchTerm`
- `Product`
- `SalesMetric`
- `AdMetric`
- `SQPMetric`
- `AuditReport`
- `MarketingPlan`
- `ChatSession`
- `ChatMessage`
- `DataSyncJob`

### Dashboard + client views

- `/dashboard` global dashboard with:
  - metric cards
  - trend chart
  - campaign/product/search-term tables
  - date range presets and custom query support
- `/clients` portfolio view
- `/clients/[id]/dashboard` with:
  - client KPIs
  - trend chart
  - SQP analyzer table
  - manual sync trigger
  - recent sync logs
- `/clients/[id]/chat` AI copilot page
- `/clients/[id]/audit` audit workflow + report list
- `/clients/[id]/reports` report + marketing plan view
- `/clients/[id]/settings` connection + sync log details
- `/connect/amazon` placeholder account connection workflow

### API routes

- `POST /api/chat` streaming AI response using Claude (with strict fallback mode when key missing)
- `GET|POST /api/connect/amazon` OAuth placeholder and initial sync trigger
- `GET|POST /api/clients/[id]/sync` sync status + manual/retry trigger
- `POST /api/clients/[id]/audit` audit generation
- `GET|POST /api/clients/[id]/reports` report + marketing plan generation

### Amazon integration layer (placeholders)

- `lib/amazon/ads.ts`
- `lib/amazon/sp-api.ts`
- `lib/amazon/brand-analytics.ts`
- `lib/amazon/sync.ts`

Includes token vault encryption helpers, token refresh placeholders, and normalized sync orchestration functions:

- `syncCampaigns()`
- `syncAdGroups()`
- `syncKeywords()`
- `syncSearchTerms()`
- `syncProducts()`
- `syncSalesMetrics()`
- `syncSQPData()`
- `normalizeMetrics()`

### Queue + scheduled sync abstraction

- BullMQ queue enqueue (`lib/queue/jobs.ts`)
- Worker runner (`lib/queue/worker.ts`)
- Daily scheduler function (`lib/queue/scheduler.ts`)
- CLI scripts:
  - `npm run worker`
  - `npm run cron`

## Setup

1. Copy env vars:

```bash
cp .env.example .env
```

2. Install dependencies:

```bash
npm install
```

3. Generate Prisma client:

```bash
npm run prisma:generate
```

4. Push schema to DB (or run migrations):

```bash
npm run db:push
```

5. Seed mock data:

```bash
npm run db:seed
```

6. Start app:

```bash
npm run dev
```

## Environment Variables

Required keys are documented in `.env.example`:

- `AMAZON_ADS_CLIENT_ID`
- `AMAZON_ADS_CLIENT_SECRET`
- `AMAZON_ADS_REDIRECT_URI`
- `AMAZON_SP_API_CLIENT_ID`
- `AMAZON_SP_API_CLIENT_SECRET`
- `AMAZON_REFRESH_TOKEN`
- `ANTHROPIC_API_KEY`
- `DATABASE_URL`
- `REDIS_URL`
- `TOKEN_ENCRYPTION_SECRET`
