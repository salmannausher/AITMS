# Devsphinx AI Dispatch

An AI-powered dispatch copilot for small and medium trucking carriers (1–100 trucks). AI agents handle parsing broker emails, scoring loads, ranking drivers, and sending WhatsApp assignments — so one dispatcher can manage 3× the trucks.

---

## The Core Loop

```
Broker emails rate-con
  → AI parses it
  → AI scores it (GOOD / MARGINAL / AVOID)
  → Dispatcher sees score on load board
  → One-click assign
  → Driver gets WhatsApp
  → Driver replies YES/NO
  → Load board updates
```

---

## Monorepo Structure

```
/
├── apps/
│   ├── web/          ← Next.js 14 (App Router) — dispatcher UI
│   └── api/          ← NestJS 10 — backend, AI agents, webhooks
├── packages/
│   └── shared/       ← Zod schemas + TypeScript types
├── CLAUDE.md
├── package.json      ← pnpm workspace root
└── turbo.json
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14 (App Router) + Tailwind CSS + Shadcn UI |
| Backend | NestJS 10 |
| Database | PostgreSQL via Supabase |
| ORM | Prisma |
| Auth | Supabase Auth + @supabase/ssr |
| Realtime | Supabase Realtime |
| Queue | BullMQ |
| AI | Anthropic Claude API |
| Messaging | Twilio WhatsApp + SMS |
| Cache | Redis (Upstash) |
| Package manager | pnpm workspaces |
| Monorepo | Turborepo |

---

## Getting Started

### Prerequisites

- Node.js 22+
- pnpm (`npm install -g pnpm`)
- A [Supabase](https://supabase.com) project

### 1. Clone and install

```bash
git clone https://github.com/salmannausher/AITMS.git
cd AITMS
pnpm install
```

### 2. Environment variables

**`apps/api/.env`**
```bash
DATABASE_URL=
DIRECT_URL=
SUPABASE_URL=
SUPABASE_SERVICE_KEY=
```

**`apps/web/.env`**
```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_API_URL=http://localhost:3001
```

> Get `DATABASE_URL` + `DIRECT_URL` from Supabase → Settings → Database → Connection string.
> Get Supabase keys from Supabase → Settings → API Keys.

### 3. Run database migrations

```bash
pnpm --filter @aitms/api db:migrate
```

### 4. Start development servers

```bash
pnpm dev
```

- Web → http://localhost:3000
- API → http://localhost:3001

---

## Key Commands

```bash
# Development
pnpm dev                          # Start both web + api

# Database
pnpm --filter @aitms/api db:migrate       # Run migrations
pnpm --filter @aitms/api db:studio        # Open Prisma Studio
pnpm --filter @aitms/api db:generate      # Regenerate Prisma client

# Quality
pnpm lint                         # ESLint all packages
pnpm typecheck                    # TypeScript check all packages
pnpm test                         # Run all tests

# Build
pnpm build                        # Build all packages
```

---

## AI Agents

| Agent | Module | Trigger |
|---|---|---|
| Intake Agent | `intake/` | Inbound email webhook |
| Rate Analysis Agent | `rate-analysis/` | `load.created` event |
| Dispatch Agent | `dispatch/` | `load.accepted` event |
| Driver Comms Agent | `communication/` | `dispatch.approved` event |

---

## MVP Status

- [x] Monorepo scaffold (Turborepo + pnpm)
- [x] Prisma schema — 9 models, full TMS domain
- [x] Supabase Auth — signup, login, middleware, JWT custom claims
- [x] Company onboarding — `POST /companies/onboard`
- [ ] Intake Agent — broker email → load record
- [ ] Rate Analysis Agent — AI load scoring
- [ ] Driver availability board
- [ ] WhatsApp dispatch
- [ ] Real-time load board

---

## Contributing

This is a private pre-revenue project. Not open for external contributions at this stage.
