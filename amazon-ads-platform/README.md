# AdsIntel — Amazon Ads + Sales Intelligence Platform

A production-ready multi-client Amazon Advertising & Sales intelligence SaaS built for agencies and brands.

## Features

- **Multi-tenant workspace** with role-based access (Owner, Admin, Analyst, Viewer)
- **Multi-client dashboard** — manage multiple Amazon seller/brand accounts
- **Analytics dashboard** with ACOS, ROAS, TACOS, CTR, CVR, CPC, CPA metrics + trend charts
- **Campaign performance table** with ACOS color-coding and status
- **SQP Analyzer** — Search Query Performance with Scale/Cut/Test/Defend/Monitor recommendations
- **AI Co-Pilot** powered by Claude API — streaming responses, context-aware, uses real client data
- **Account Audit** — automated finding generation (wasted spend, high ACOS, zero-conversion campaigns, SQP gaps)
- **Report Generator** — weekly reports, marketing plans, SQP reports via AI
- **Amazon API Integration** — Ads API + SP-API OAuth flow + placeholder sync functions
- **BullMQ sync queue** — background jobs with retry, daily scheduled sync, job history
- **Prisma ORM** — full schema with 18+ models, migrations, seed data

## Tech Stack

- **Framework**: Next.js 16 App Router + TypeScript
- **UI**: Tailwind CSS v4 + shadcn/ui + Recharts
- **Database**: PostgreSQL + Prisma ORM v7
- **AI**: Anthropic Claude API (streaming)
- **Queue**: BullMQ + Redis
- **Auth**: bcryptjs + session management

## Quick Start

### 1. Install dependencies

```bash
cd amazon-ads-platform
npm install
```

### 2. Configure environment variables

```bash
cp .env.example .env
```

Edit `.env` with your values:

```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/amazon_ads_platform"
NEXTAUTH_SECRET="your-secret-here"
ANTHROPIC_API_KEY="sk-ant-..."
REDIS_URL="redis://localhost:6379"

# Amazon Ads API (get from Amazon Developer Console)
AMAZON_ADS_CLIENT_ID=""
AMAZON_ADS_CLIENT_SECRET=""
AMAZON_ADS_REDIRECT_URI="http://localhost:3000/api/amazon/oauth/callback"

# Amazon SP-API
AMAZON_SP_API_CLIENT_ID=""
AMAZON_SP_API_CLIENT_SECRET=""
```

### 3. Set up database

```bash
# Run migrations
npm run db:migrate

# Seed with demo data
npm run db:seed
```

### 4. Start the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

**Demo credentials**: `demo@amazonads.pro` / `demo1234`

## Project Structure

```
amazon-ads-platform/
├── app/
│   ├── (app)/               # Authenticated app layout
│   │   ├── dashboard/       # Agency overview dashboard
│   │   ├── clients/         # Client management
│   │   │   ├── [id]/
│   │   │   │   ├── dashboard/   # Per-client analytics
│   │   │   │   ├── sqp/         # SQP Analyzer
│   │   │   │   ├── chat/        # AI Co-Pilot
│   │   │   │   ├── audit/       # Account Audit
│   │   │   │   ├── reports/     # Report Generator
│   │   │   │   └── settings/    # Client settings & API connection
│   │   ├── sync/            # Sync job management
│   │   └── connect/amazon/  # Amazon OAuth flow
│   └── api/
│       ├── chat/            # Streaming Claude API endpoint
│       ├── sync/            # BullMQ job trigger
│       ├── audit/           # Audit generation
│       ├── metrics/         # Analytics data
│       ├── clients/         # Client CRUD
│       └── amazon/oauth/    # Amazon OAuth callback
├── components/
│   ├── layout/              # Sidebar, Header
│   ├── dashboard/           # MetricCard
│   ├── charts/              # SpendSalesChart, AcosChart (Recharts)
│   ├── tables/              # CampaignTable, SQPTable
│   └── chat/                # ChatInterface (streaming)
├── lib/
│   ├── amazon/              # Ads API, SP-API, sync jobs
│   ├── anthropic/           # Claude client, context builder
│   ├── analytics/           # Metrics, SQP, Audit logic
│   ├── queue/               # BullMQ sync queue
│   ├── db.ts                # Prisma singleton
│   ├── auth.ts              # User auth helpers
│   ├── mock-data.ts         # Demo data generators
│   └── types.ts             # TypeScript interfaces
└── prisma/
    ├── schema.prisma        # 18+ model schema
    └── seed.ts              # Demo data seeder
```

## Amazon API Setup

### Advertising API
1. Register at [Amazon Advertising Console](https://advertising.amazon.com/)
2. Create an application in Developer Console
3. Set redirect URI to `https://yourdomain.com/api/amazon/oauth/callback`
4. Add `AMAZON_ADS_CLIENT_ID` and `AMAZON_ADS_CLIENT_SECRET` to env

### SP-API
1. Register at [Seller Central Developer](https://sellercentral.amazon.com/developer/)
2. Create a SP-API app with the following roles:
   - Sales Report
   - Brand Analytics
   - Catalog Items
3. Add `AMAZON_SP_API_CLIENT_ID` and `AMAZON_SP_API_CLIENT_SECRET` to env

## AI Co-Pilot

The Claude-powered chat assistant receives full client context including:
- Aggregate metrics (ACOS, ROAS, TACOS, spend, sales, etc.)
- Top 20 campaigns by spend
- Top 10 products by revenue
- Top 20 SQP queries with classifications
- Wasted spend estimate and scaling opportunities

The system prompt enforces data-grounded responses only — no hallucination.

## Sync Architecture

```
Manual Sync Button → /api/sync POST
                  ↓
            createSyncJob() → DB (DataSyncJob record)
                  ↓
         enqueueSyncJob() → BullMQ Queue → Worker → runSyncJob()
                                             ↓
                                     Amazon Ads API / SP-API
                                             ↓
                                      Prisma upsert → PostgreSQL
```

Daily auto-sync is scheduled via BullMQ repeatable jobs (cron: `0 6 * * *`).

## Deployment (Vercel)

1. Push to GitHub
2. Connect to Vercel
3. Add all environment variables in Vercel dashboard
4. Set up a managed PostgreSQL (Supabase, Neon, Railway)
5. Set up managed Redis (Upstash)
6. Deploy

For the BullMQ worker in production, run it as a separate process or use a background job service.

## License

MIT
