# Ads Intel — Amazon Ads & Sales Intelligence SaaS

Production-ready MVP for agencies and brands that connects Amazon Advertising API and Amazon Selling Partner API data, normalizes it into PostgreSQL, provides analytics dashboards, and includes an AI co-pilot powered by Claude.

## Features

- **Multi-tenant workspace** with role-based access (Owner, Admin, Analyst, Viewer)
- **Multi-client dashboard** with ACOS, TACOS, ROAS, and period comparisons
- **Campaign, product, and search term** performance tables
- **SQP Analyzer** — Search Query Performance with scale/cut/test/defend actions
- **AI Co-Pilot** — Claude-powered assistant using live client data (no hallucinations)
- **Audit workflow** — wasted spend, high ACOS, SQP opportunities
- **Marketing plans & client reports**
- **Amazon API integration layer** with OAuth, encrypted tokens, and sync jobs
- **BullMQ queue** with daily cron sync

## Tech Stack

- Next.js 15 (App Router) · TypeScript · React · Tailwind CSS · shadcn/ui
- PostgreSQL · Prisma ORM
- Anthropic Claude API · BullMQ · Redis

## Quick Start

### 1. Start infrastructure

```bash
docker compose up -d
```

### 2. Configure environment

```bash
cp .env.example .env
```

Update `DATABASE_URL`:

```
DATABASE_URL="postgresql://adsintel:adsintel@localhost:5432/ads_intel?schema=public"
```

### 3. Install & setup database

```bash
npm install
npx prisma db push
npm run db:seed
```

### 4. Run development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

**Demo login:** `demo@adsintel.com` / `demo1234`

## Project Structure

```
app/
  dashboard/          # Workspace overview
  clients/            # Client list & detail pages
  connect/amazon/     # OAuth connection flow
  api/                # API routes (chat, sync, auth, cron)
components/
  dashboard/          # Metric cards, date picker, client switcher
  charts/             # Recharts trend charts
  tables/             # Data tables
  chat/               # AI co-pilot interface
  layout/             # Sidebar, app shell
lib/
  amazon/             # Ads API, SP-API, sync, encryption
  anthropic/          # Claude client & context builder
  analytics/          # Metrics, SQP, insights
  auth/               # Session, permissions
  db/                 # Prisma client
  queue/              # BullMQ sync queue
  reports/            # Audit, marketing plan, client report
prisma/
  schema.prisma       # Full data model
  seed.ts             # Mock client data (60 days)
```

## Pages

| Route | Description |
|-------|-------------|
| `/dashboard` | Workspace overview across all clients |
| `/clients` | Client list |
| `/clients/[id]/dashboard` | Client analytics dashboard |
| `/clients/[id]/chat` | AI co-pilot |
| `/clients/[id]/sqp` | SQP analyzer |
| `/clients/[id]/audit` | Account audit |
| `/clients/[id]/reports` | Client reports & marketing plans |
| `/clients/[id]/settings` | Connections & sync history |
| `/connect/amazon` | Amazon OAuth connections |

## Environment Variables

See `.env.example` for all required variables.

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | PostgreSQL connection |
| `ANTHROPIC_API_KEY` | Claude API (optional — mock responses without it) |
| `AMAZON_ADS_*` | Amazon Advertising OAuth |
| `AMAZON_SP_API_*` | Selling Partner API |
| `REDIS_URL` | BullMQ job queue (optional) |
| `CRON_SECRET` | Protect daily sync cron endpoint |

## Deployment (Vercel)

1. Connect repository to Vercel
2. Add PostgreSQL (Neon, Supabase, etc.) and set `DATABASE_URL`
3. Run `npx prisma db push` and `npm run db:seed`
4. Set environment variables in Vercel dashboard
5. Daily sync runs via Vercel Cron (`vercel.json`)

## API Routes

- `POST /api/auth/login` — User authentication
- `POST /api/chat` — Streaming Claude co-pilot
- `POST /api/sync` — Manual data sync
- `GET /api/cron/daily-sync` — Scheduled daily sync
- `GET /api/amazon/ads/connect` — Amazon Ads OAuth
- `POST /api/audit` — Generate audit report

## License

MIT
