# Amazon Ads Intelligence

Production-ready MVP for a multi-client Amazon Ads + Sales Intelligence SaaS platform. Built for agencies and brands to connect Amazon Advertising API and Selling Partner API data, normalize it into PostgreSQL, provide analytics dashboards, and include an AI co-pilot powered by Claude.

## Tech Stack

- **Frontend:** Next.js 15 (App Router), React 19, Tailwind CSS, shadcn/ui
- **Backend:** Next.js API routes, Prisma ORM, PostgreSQL
- **AI:** Anthropic Claude API (streaming)
- **Jobs:** BullMQ + Redis (with inline fallback when Redis unavailable)
- **Deploy:** Vercel-ready with cron for daily syncs

## Features

- Multi-tenant workspaces with role-based access (Owner, Admin, Analyst, Viewer)
- Multi-client dashboard with ACOS, TACOS, ROAS, and period comparisons
- Campaign, product, search term, and SQP performance tables
- AI co-pilot that answers questions using only database-backed client data
- Account audit workflow with findings and marketing plan generation
- Amazon API integration layer (OAuth placeholder + sync abstraction)
- Manual and scheduled data sync with job status tracking

## Quick Start

### Prerequisites

- Node.js 20+
- PostgreSQL 15+
- Redis (optional)

### Setup

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Start PostgreSQL (example with Docker)
docker run -d --name ads-pg -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=amazon_ads_intel -p 5432:5432 postgres:15

# Push schema and seed demo data
npm run db:push
npm run db:seed

# Start dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and sign in with:

- **Email:** demo@adsintel.com
- **Password:** demo1234

## Project Structure

```
app/
  dashboard/          # Workspace-level dashboard
  clients/            # Client list and detail pages
  connect/amazon/     # Amazon connection flow
  api/                # API routes (auth, sync, chat, audit, reports)
components/
  dashboard/          # Metric cards, charts, tables
  chat/               # AI chat interface
  layout/             # Sidebar and app shell
lib/
  amazon/             # Amazon Ads + SP-API clients and sync
  anthropic/          # Claude API integration
  analytics/          # Metrics, SQP, context builders
  auth/               # Session and encryption
  queue/              # BullMQ job queue
  reports/            # Audit and marketing plan generators
prisma/
  schema.prisma       # Full data model
  seed.ts             # Demo data for 3 clients
```

## Environment Variables

See `.env.example` for all required variables. Key ones:

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `AUTH_SECRET` | JWT session signing secret |
| `ENCRYPTION_KEY` | Token encryption key |
| `ANTHROPIC_API_KEY` | Claude API key (optional — fallback responses without it) |
| `REDIS_URL` | Redis for BullMQ (optional — syncs run inline without it) |
| `AMAZON_ADS_*` | Amazon Advertising API credentials |
| `AMAZON_SP_API_*` | Selling Partner API credentials |

## API Routes

| Route | Method | Description |
|-------|--------|-------------|
| `/api/auth/login` | POST | User authentication |
| `/api/clients` | GET/POST | List/create clients |
| `/api/sync` | POST/GET | Trigger sync / list jobs |
| `/api/sync/retry` | POST | Retry failed sync job |
| `/api/chat` | POST | Streaming AI chat |
| `/api/audit` | POST/GET | Run audit / list reports |
| `/api/reports` | POST | Generate client report or marketing plan |
| `/api/amazon/ads/connect` | POST | Start Amazon Ads OAuth |
| `/api/cron/daily-sync` | GET | Scheduled daily sync (Vercel cron) |

## Pages

- `/dashboard` — Workspace portfolio dashboard
- `/clients` — Client list
- `/clients/[id]/dashboard` — Client analytics with SQP analyzer
- `/clients/[id]/chat` — AI co-pilot
- `/clients/[id]/audit` — Account audit
- `/clients/[id]/reports` — Client reports and marketing plans
- `/clients/[id]/settings` — Connections and sync settings
- `/connect/amazon` — Amazon account connection

## Deployment (Vercel)

1. Connect repository to Vercel
2. Add environment variables from `.env.example`
3. Use Vercel Postgres or external PostgreSQL for `DATABASE_URL`
4. Add Upstash Redis for `REDIS_URL` (optional)
5. Cron job runs daily at 6 AM UTC via `vercel.json`

## License

MIT
