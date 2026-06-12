# Amazon Ads + Sales Intelligence MVP

Production-ready MVP foundation for a multi-client Amazon Ads and sales intelligence SaaS built with Next.js, TypeScript, Prisma, PostgreSQL, Tailwind CSS, shadcn-style UI primitives, BullMQ, and Anthropic Claude.

## What is included

- Multi-tenant workspace structure with users, roles, clients, and Amazon connections
- Prisma schema for Amazon Ads, SP-API, SQP, audits, marketing plans, chat, and sync jobs
- Seed script with realistic mock agency/client data
- Portfolio dashboard and per-client drill-down dashboards
- Campaign, product, search term, and SQP analytics tables
- AI co-pilot route with streaming responses and Claude-ready grounding
- Connect account -> sync -> audit -> marketing plan -> report workflow scaffolding
- BullMQ-ready manual and scheduled sync endpoints
- Amazon OAuth placeholder callback with encrypted token storage helpers

## Core routes

- `/dashboard`
- `/clients`
- `/clients/[id]`
- `/clients/[id]/dashboard`
- `/clients/[id]/chat`
- `/clients/[id]/audit`
- `/clients/[id]/reports`
- `/clients/[id]/settings`
- `/connect/amazon`

## Environment variables

Copy `.env.example` to `.env.local` and fill in the values:

```bash
cp .env.example .env.local
```

Required keys:

- `DATABASE_URL`
- `REDIS_URL`
- `NEXTAUTH_SECRET`
- `NEXTAUTH_URL`
- `AMAZON_ADS_CLIENT_ID`
- `AMAZON_ADS_CLIENT_SECRET`
- `AMAZON_ADS_REDIRECT_URI`
- `AMAZON_SP_API_CLIENT_ID`
- `AMAZON_SP_API_CLIENT_SECRET`
- `AMAZON_REFRESH_TOKEN`
- `ANTHROPIC_API_KEY`

## Local development

Install dependencies:

```bash
npm install
```

Generate the Prisma client:

```bash
npm run db:generate
```

Push the schema to PostgreSQL:

```bash
npm run db:push
```

Seed the database:

```bash
npm run db:seed
```

Start the app:

```bash
npm run dev
```

## Demo auth

For immediate testing, the login page ships with demo credentials:

- `owner@demo.com`
- `demo1234`

## Architecture notes

- Runtime data access falls back to seeded demo data when the database is not configured or unavailable.
- The analytics service layer is isolated from the UI so it can later be moved behind a different backend service, including FastAPI.
- The Amazon service modules expose `syncCampaigns`, `syncAdGroups`, `syncKeywords`, `syncSearchTerms`, `syncProducts`, `syncSalesMetrics`, `syncSQPData`, and `normalizeMetrics` placeholder functions ready for live API implementation.
- The chat route uses a strict system prompt and only passes client context built from the application data layer.
