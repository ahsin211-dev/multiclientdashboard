# Amazon Ads Intelligence

A production-ready MVP for a **multi-client Amazon Ads + Sales Intelligence SaaS platform**. Built for agencies and brands to connect Amazon Advertising API and Selling Partner API data, normalize it into PostgreSQL, provide analytics dashboards, and include an AI co-pilot powered by Claude.

---

## Table of Contents

- [About](#about)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Project Structure](#project-structure)
- [Data Model](#data-model)
- [Setup Guide](#setup-guide)
- [Environment Variables](#environment-variables)
- [Pages & Routes](#pages--routes)
- [Core Workflows](#core-workflows)
- [Development](#development)
- [Deployment](#deployment)
- [Roadmap](#roadmap)

---

## About

Amazon Ads Intelligence is a multi-tenant dashboard that helps Amazon agencies and brand teams:

1. **Connect** Amazon Advertising and Selling Partner API accounts per client
2. **Sync** campaigns, keywords, search terms, sales metrics, and SQP data into PostgreSQL
3. **Analyze** performance with ACOS, TACOS, ROAS, CTR, and period-over-period comparisons
4. **Audit** accounts for wasted spend, high ACOS, and missed SQP opportunities
5. **Plan** with AI-generated marketing plans and client reports
6. **Ask** an AI co-pilot questions grounded in live client data (no hallucination)

The MVP ships with **seeded demo data** for 3 clients so you can explore the full UI immediately. The Amazon API integration layer is scaffolded and ready to swap in live credentials.

---

## Features

| Feature | Description |
|---------|-------------|
| **Multi-tenant workspaces** | Teams with role-based access: Owner, Admin, Analyst, Viewer |
| **Multi-client accounts** | Each client has brand, marketplace, connections, and sync status |
| **Analytics dashboard** | Metric cards, trend charts, campaign/product/search term tables |
| **SQP Analyzer** | Joins Search Query Performance with PPC data; recommends Scale/Cut/Test/Defend |
| **AI Co-Pilot** | Streaming Claude chat using only database-backed client context |
| **Account audit** | Automated findings: wasted spend, high ACOS, low CTR, SQP gaps |
| **Marketing plans** | 30-day roadmap with immediate fixes, restructuring, and keyword actions |
| **Client reports** | Executive summary with metrics, problems, and recommended actions |
| **Data sync** | Manual sync, daily cron, job status tracking, retry on failure |
| **Amazon OAuth** | Placeholder OAuth flow with encrypted token storage |

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 15 (App Router), React 19, Tailwind CSS, shadcn/ui |
| Backend | Next.js API Routes, Node.js |
| Database | PostgreSQL, Prisma ORM |
| AI | Anthropic Claude API (streaming) |
| Jobs | BullMQ + Redis (inline fallback when Redis unavailable) |
| Auth | JWT sessions (jose), bcrypt, AES-256-GCM token encryption |
| Charts | Recharts |
| Validation | Zod |
| Deploy | Vercel (with cron for daily syncs) |

---

## Architecture

### High-Level Overview

```mermaid
flowchart TB
    subgraph Client["Browser"]
        UI[Next.js App Router UI]
    end

    subgraph App["Next.js Server"]
        API[API Routes]
        Auth[Auth / Sessions]
        Analytics[Analytics Services]
        Reports[Audit & Reports]
        Chat[Claude Co-Pilot]
        Sync[Sync Pipeline]
    end

    subgraph External["External Services"]
        AmazonAds[Amazon Advertising API]
        SPAPI[Selling Partner API]
        Claude[Anthropic Claude API]
        Redis[(Redis / BullMQ)]
    end

    subgraph Data["Data Layer"]
        PG[(PostgreSQL)]
    end

    UI --> API
    API --> Auth
    API --> Analytics
    API --> Reports
    API --> Chat
    API --> Sync
    Analytics --> PG
    Reports --> PG
    Chat --> PG
    Chat --> Claude
    Sync --> PG
    Sync --> Redis
    Sync --> AmazonAds
    Sync --> SPAPI
```

### Multi-Tenant Data Flow

```mermaid
flowchart LR
    User --> Workspace
    Workspace --> Client1[Client A]
    Workspace --> Client2[Client B]
    Workspace --> Client3[Client C]

    Client1 --> AdsConn[Amazon Ads Connection]
    Client1 --> SPConn[SP-API Connection]
    Client1 --> Campaigns
    Client1 --> Metrics[Ad & Sales Metrics]
    Client1 --> SQP[SQP Metrics]
```

### Connect → Audit → Plan Workflow

```mermaid
flowchart TD
    A[1. Connect Amazon Account] --> B[2. Run Data Sync]
    B --> C[3. Run Account Audit]
    C --> D{Findings}
    D --> E[Wasted Spend]
    D --> F[High ACOS Campaigns]
    D --> G[SQP Missed Opportunities]
    D --> H[Low CTR Keywords]
    C --> I[4. Generate Marketing Plan]
    I --> J[5. Generate Client Report]
    I --> K[6. AI Co-Pilot Q&A]
```

### Sync Pipeline

```mermaid
sequenceDiagram
    participant User
    participant API
    participant Queue as BullMQ / Inline
    participant Sync as Sync Service
    participant DB as PostgreSQL

    User->>API: POST /api/sync
    API->>DB: Create DataSyncJob (PENDING)
    API->>Queue: Enqueue job
    Queue->>Sync: executeSyncJob()
    Sync->>Sync: syncCampaigns()
    Sync->>Sync: syncAdGroups()
    Sync->>Sync: syncKeywords()
    Sync->>Sync: syncSearchTerms()
    Sync->>Sync: syncProducts()
    Sync->>Sync: syncSalesMetrics()
    Sync->>Sync: syncSQPData()
    Sync->>Sync: normalizeMetrics()
    Sync->>DB: Update job status (COMPLETED)
```

---

## Project Structure

```
amazon-ads-intelligence/
├── app/                          # Next.js App Router
│   ├── api/                      # API routes
│   │   ├── auth/                 # Login, logout
│   │   ├── clients/              # Client CRUD
│   │   ├── sync/                 # Data sync + retry
│   │   ├── chat/                 # Streaming AI chat
│   │   ├── audit/                # Account audit
│   │   ├── reports/              # Client reports & marketing plans
│   │   ├── amazon/ads/           # Amazon Ads OAuth
│   │   └── cron/daily-sync/      # Scheduled sync cron
│   ├── dashboard/                # Workspace portfolio dashboard
│   ├── clients/                  # Client list & detail pages
│   │   └── [id]/
│   │       ├── dashboard/        # Client analytics + SQP
│   │       ├── chat/             # AI co-pilot
│   │       ├── audit/            # Account audit
│   │       ├── reports/          # Reports & plans
│   │       └── settings/         # Connections & sync
│   ├── connect/amazon/           # Amazon connection flow
│   └── login/                    # Authentication page
│
├── components/
│   ├── ui/                       # shadcn/ui primitives
│   ├── dashboard/                # Metric cards, charts, tables
│   ├── chat/                     # Chat interface
│   └── layout/                   # Sidebar, app shell
│
├── lib/
│   ├── amazon/                   # Amazon Ads + SP-API clients, sync
│   ├── anthropic/                # Claude API + system prompts
│   ├── analytics/                # Metrics, SQP, date ranges, context
│   ├── auth/                     # Sessions, encryption
│   ├── db/                       # Prisma client
│   ├── queue/                    # BullMQ job queue
│   ├── reports/                  # Audit, marketing plan, client report
│   ├── types/                    # TypeScript interfaces
│   └── validations/              # Zod schemas
│
├── prisma/
│   ├── schema.prisma             # Full data model (20+ models)
│   └── seed.ts                   # Demo data (3 clients, 60 days metrics)
│
├── middleware.ts                  # Auth middleware
├── vercel.json                   # Cron config (daily sync at 6 AM UTC)
└── .env.example                  # Environment variable template
```

---

## Data Model

### Core Entities

| Model | Purpose |
|-------|---------|
| `User` | Platform users with email/password auth |
| `Workspace` | Agency or brand team container |
| `WorkspaceMember` | User ↔ Workspace with role (Owner/Admin/Analyst/Viewer) |
| `Client` | Brand account with marketplace and sync status |
| `AmazonConnection` | Encrypted OAuth tokens for Ads or SP-API |
| `AdAccount` | Amazon Advertising account linked to a client |
| `Campaign` | Sponsored Products/Brands/Display campaigns |
| `AdGroup` | Ad groups within campaigns |
| `Keyword` | Targeting keywords with match types |
| `SearchTerm` | Customer search query performance |
| `Product` | ASIN catalog |
| `SalesMetric` | Daily sales/revenue/sessions per client |
| `AdMetric` | Daily ad performance (spend, ACOS, ROAS, etc.) |
| `SQPMetric` | Search Query Performance with recommended actions |
| `AuditReport` | Generated audit findings and health score |
| `MarketingPlan` | 30-day plan with sections and roadmap |
| `ChatSession` / `ChatMessage` | AI co-pilot conversation history |
| `DataSyncJob` | Background sync job with status and logs |

### Role Hierarchy

```
Owner > Admin > Analyst > Viewer
```

- **Owner** — Full workspace control
- **Admin** — Manage clients, connections, syncs
- **Analyst** — View dashboards, run audits, use AI chat
- **Viewer** — Read-only access

---

## Setup Guide

### Prerequisites

| Requirement | Version | Required |
|-------------|---------|----------|
| Node.js | 20+ | Yes |
| PostgreSQL | 15+ | Yes |
| Redis | 6+ | No (syncs run inline without it) |
| npm | 9+ | Yes |

### Step 1: Clone and install

```bash
git clone https://github.com/ahsin211-dev/multiclientdashboard.git
cd multiclientdashboard
npm install
```

### Step 2: Configure environment

```bash
cp .env.example .env
```

Edit `.env` with your values. Minimum required for local development:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/amazon_ads_intel?schema=public"
AUTH_SECRET="your-random-secret-here"
ENCRYPTION_KEY="your-32-char-encryption-key!!"
```

### Step 3: Start PostgreSQL

**Option A — Docker:**

```bash
docker run -d \
  --name ads-pg \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=amazon_ads_intel \
  -p 5432:5432 \
  postgres:15
```

**Option B — Local install (Ubuntu/Debian):**

```bash
sudo apt-get install postgresql postgresql-contrib
sudo pg_ctlcluster 16 main start
sudo -u postgres psql -c "CREATE DATABASE amazon_ads_intel;"
sudo -u postgres psql -c "ALTER USER postgres PASSWORD 'postgres';"
```

**Option C — Cloud (Vercel Postgres, Supabase, Neon):**

Copy the connection string into `DATABASE_URL`.

### Step 4: Initialize database

```bash
# Push Prisma schema to database
npm run db:push

# Seed demo data (3 clients, 60 days of metrics)
npm run db:seed
```

### Step 5: Start development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### Step 6: Sign in with demo credentials

| Field | Value |
|-------|-------|
| Email | `demo@adsintel.com` |
| Password | `demo1234` |

### Optional: Redis for background jobs

```bash
docker run -d --name ads-redis -p 6379:6379 redis:7
```

Add to `.env`:

```env
REDIS_URL="redis://localhost:6379"
```

Without Redis, sync jobs execute inline (fine for development).

### Optional: Claude AI co-pilot

Add to `.env`:

```env
ANTHROPIC_API_KEY="sk-ant-..."
```

Without this key, the chat falls back to rule-based responses using client data.

### Optional: Amazon API credentials

```env
AMAZON_ADS_CLIENT_ID="amzn1.application-oa2-client..."
AMAZON_ADS_CLIENT_SECRET="..."
AMAZON_ADS_REDIRECT_URI="http://localhost:3000/api/amazon/ads/callback"
AMAZON_SP_API_CLIENT_ID="amzn1.application-oa2-client..."
AMAZON_SP_API_CLIENT_SECRET="..."
AMAZON_SP_API_REFRESH_TOKEN="Atzr|..."
```

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `AUTH_SECRET` | Yes | JWT session signing secret (random string) |
| `ENCRYPTION_KEY` | Yes | AES-256 key for token encryption (32+ chars) |
| `ANTHROPIC_API_KEY` | No | Claude API key for AI co-pilot |
| `REDIS_URL` | No | Redis URL for BullMQ background jobs |
| `AMAZON_ADS_CLIENT_ID` | No | Amazon Advertising API client ID |
| `AMAZON_ADS_CLIENT_SECRET` | No | Amazon Advertising API client secret |
| `AMAZON_ADS_REDIRECT_URI` | No | OAuth callback URL |
| `AMAZON_SP_API_CLIENT_ID` | No | Selling Partner API client ID |
| `AMAZON_SP_API_CLIENT_SECRET` | No | Selling Partner API client secret |
| `AMAZON_SP_API_REFRESH_TOKEN` | No | SP-API refresh token |
| `CRON_SECRET` | No | Bearer token for Vercel cron endpoint |

---

## Pages & Routes

### UI Pages

| Page | Path | Description |
|------|------|-------------|
| Login | `/login` | Authentication |
| Dashboard | `/dashboard` | Workspace portfolio overview |
| Clients | `/clients` | Client list with key metrics |
| New Client | `/clients/new` | Create a new client |
| Client Dashboard | `/clients/[id]/dashboard` | Full analytics + SQP analyzer |
| AI Co-Pilot | `/clients/[id]/chat` | Streaming Claude chat |
| Audit | `/clients/[id]/audit` | Run and view account audits |
| Reports | `/clients/[id]/reports` | Client reports & marketing plans |
| Settings | `/clients/[id]/settings` | Connections, sync history |
| Connect Amazon | `/connect/amazon` | Amazon account connection |

### API Routes

| Route | Method | Description |
|-------|--------|-------------|
| `/api/auth/login` | POST | Authenticate user, set session cookie |
| `/api/auth/logout` | POST | Clear session |
| `/api/clients` | GET | List workspace clients |
| `/api/clients` | POST | Create new client |
| `/api/clients/[id]` | GET | Get client details |
| `/api/sync` | POST | Trigger data sync for a client |
| `/api/sync` | GET | List sync jobs for a client |
| `/api/sync/retry` | POST | Retry a failed sync job |
| `/api/chat` | POST | Streaming AI chat (SSE) |
| `/api/audit` | POST | Run account audit |
| `/api/audit` | GET | List audit reports |
| `/api/reports` | POST | Generate client report or marketing plan |
| `/api/amazon/ads/connect` | POST | Start Amazon Ads OAuth flow |
| `/api/amazon/ads/callback` | GET | OAuth callback handler |
| `/api/cron/daily-sync` | GET | Daily scheduled sync (Vercel cron) |

---

## Core Workflows

### 1. Connect Amazon Account

1. Go to `/connect/amazon` or client Settings
2. Click "Connect Amazon Ads"
3. Complete OAuth (requires `AMAZON_ADS_*` env vars)
4. Tokens are encrypted and stored in `AmazonConnection`
5. First sync is triggered automatically

### 2. Run Account Audit

1. Navigate to `/clients/[id]/audit`
2. Click "Run Audit"
3. System analyzes: wasted spend, high ACOS, low CTR, SQP gaps, conversion issues
4. Findings are saved with a health score (0–100)

### 3. Generate Marketing Plan

1. Navigate to `/clients/[id]/reports`
2. Select "Marketing Plan" tab
3. Click "Generate Plan"
4. Receives: immediate fixes, campaign restructuring, budget reallocation, keyword actions, SQP strategy, 30-day roadmap

### 4. AI Co-Pilot

1. Navigate to `/clients/[id]/chat`
2. Ask questions like:
   - "Why did ACOS increase last week?"
   - "Which campaigns should I cut?"
   - "Find wasted spend"
   - "Which SQP queries have high impression share but low PPC investment?"
3. AI uses only database-backed client context — never hallucinates metrics

### 5. SQP Analyzer

Built into the client dashboard (`/clients/[id]/dashboard`). Joins Search Query Performance with PPC data and recommends:

| Action | When |
|--------|------|
| **Scale** | High purchase share, low PPC spend, strong ROAS |
| **Cut** | High spend, low purchase share, poor ACOS |
| **Test** | High impression share, low click share |
| **Defend** | Strong organic share, competitors likely bidding |

---

## Development

### Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server with Turbopack |
| `npm run build` | Production build (Prisma generate + Next.js) |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run db:push` | Push Prisma schema to database |
| `npm run db:seed` | Seed demo data |
| `npm run db:studio` | Open Prisma Studio (database GUI) |
| `npm run db:generate` | Regenerate Prisma client |

### Adding a New Client Programmatically

```bash
curl -X POST http://localhost:3000/api/clients \
  -H "Content-Type: application/json" \
  -b "ads-intel-session=<your-session-cookie>" \
  -d '{"brandName": "My Brand", "marketplace": "US"}'
```

### Triggering a Manual Sync

```bash
curl -X POST http://localhost:3000/api/sync \
  -H "Content-Type: application/json" \
  -b "ads-intel-session=<your-session-cookie>" \
  -d '{"clientId": "<client-id>"}'
```

### Replacing Mock Sync with Live Amazon APIs

The sync functions in `lib/amazon/sync.ts` are structured as placeholders. To connect live data:

1. Set Amazon API credentials in `.env`
2. Replace the count-only logic in each `sync*()` function with calls to `AmazonAdsClient` and `SpApiClient`
3. Map API responses to Prisma create/update operations
4. Run `normalizeMetrics()` after sync to compute ACOS, ROAS, CTR, etc.

---

## Deployment

### Vercel (Recommended)

1. **Connect repository** to Vercel
2. **Set environment variables** from `.env.example`
3. **Database:** Use [Vercel Postgres](https://vercel.com/storage/postgres), [Neon](https://neon.tech), or [Supabase](https://supabase.com)
4. **Redis (optional):** Use [Upstash Redis](https://upstash.com) for `REDIS_URL`
5. **Cron:** Daily sync runs at 6 AM UTC via `vercel.json` — protect with `CRON_SECRET`
6. **Build command:** `npm run build` (runs `prisma generate` automatically)
7. **After deploy:** Run `npx prisma db push` and `npx prisma db seed` against production database

### Environment Checklist for Production

- [ ] `DATABASE_URL` — Production PostgreSQL
- [ ] `AUTH_SECRET` — Strong random secret
- [ ] `ENCRYPTION_KEY` — 32+ character encryption key
- [ ] `ANTHROPIC_API_KEY` — For AI co-pilot
- [ ] `REDIS_URL` — For background sync jobs
- [ ] `AMAZON_ADS_*` — Amazon Advertising API credentials
- [ ] `AMAZON_SP_API_*` — Selling Partner API credentials
- [ ] `CRON_SECRET` — Protect cron endpoint
- [ ] `AMAZON_ADS_REDIRECT_URI` — Update to production URL

---

## Roadmap

- [ ] Live Amazon Advertising API sync (replace placeholder functions)
- [ ] Live SP-API sales and catalog sync
- [ ] Brand Analytics / SQP live data pull
- [ ] User registration and invite flow
- [ ] Workspace member management UI
- [ ] Custom date range picker
- [ ] PDF report export
- [ ] Webhook notifications for sync completion
- [ ] FastAPI backend extraction (optional)

---

## License

MIT
