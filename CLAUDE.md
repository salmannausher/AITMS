# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.
# Devsphinx AI Dispatch — Project Constitution

> This file is read by Claude Code at the start of every session.
> Keep it updated as the project evolves.
> Last updated: June 2026 · Phase: MVP v0.1

---

## Project Identity

**Product:** Devsphinx AI Dispatch
**Mission:** An AI-powered dispatch copilot for small and medium trucking carriers (1–100 trucks). AI agents handle the grunt work — parsing broker emails, scoring loads, ranking drivers, sending WhatsApp assignments — so one dispatcher can manage 3× the trucks.
**Company:** Devsphinx
**Stage:** Pre-revenue seed. First paying customer is the goal of Week 8.

---

## Current Phase: MVP v0.1

**What we are building right now:**

1. Rate-confirmation email ingestion + PDF parser (Intake Agent)
2. AI load scoring — Good / Marginal / Avoid (Rate Analysis Agent)
3. Driver availability board with HOS tracking
4. One-click WhatsApp driver assignment message
5. Real-time load status board (Supabase realtime)

**The dispatcher workflow we are automating:**
Broker emails rate-con → AI parses it → AI scores it → Dispatcher sees score → Clicks assign → Driver gets WhatsApp → Driver replies YES/NO → Load board updates

That loop. Nothing else. Ship that first.

---

## Monorepo Structure

```
/
├── apps/
│   ├── web/          ← Next.js 14 (App Router) — dispatcher UI
│   └── api/          ← NestJS 10 — backend, agents, webhooks
├── packages/
│   └── shared/       ← Zod schemas, TypeScript types (shared between web + api)
├── CLAUDE.md         ← this file
├── package.json      ← pnpm workspace root
└── turbo.json        ← Turborepo config
```

---

## Tech Stack

| Layer | Technology | Notes |
|---|---|---|
| Frontend | Next.js 14 (App Router) | Server Components by default; Client Components only when needed |
| UI | Tailwind CSS + Shadcn UI | new-york style, neutral palette |
| Backend | NestJS 10 | Modular — one NestJS module per AI agent |
| ORM | Prisma | All DB access via Prisma. No raw SQL except migrations |
| Database | PostgreSQL (Supabase) | Multi-tenant via company_id on every table |
| Auth | Supabase Auth + @supabase/ssr | Server-side session only — no client-side Supabase auth |
| Realtime | Supabase Realtime | Load board updates without polling |
| Cache | Redis (Upstash) | EIA fuel price (24hr TTL), lane history (1hr TTL) |
| Queue | BullMQ + @nestjs/bull | All AI agent work is queued — never call Claude API synchronously |
| AI | Anthropic Claude API (@anthropic-ai/sdk) | claude-haiku-4-5 for high-volume tasks; claude-sonnet-4-5 for complex parsing |
| Messaging | Twilio (WhatsApp + SMS fallback) | WhatsApp Business API; SMS is the fallback if WhatsApp fails |
| Validation | Zod | All schemas in packages/shared. Both web and api import from there |
| Language | TypeScript (strict) | Across all packages |
| Package manager | pnpm workspaces | Never use npm or yarn |
| CI/CD | GitHub Actions | Lint + typecheck on PR; deploy on merge to main |
| Hosting | Vercel (web) + Railway (api) | |

---

## Behavioral Guidelines

> Behavioral guidelines to reduce common LLM coding mistakes. Merge with project-specific instructions as needed.
>
> Tradeoff: These guidelines bias toward caution over speed. For trivial tasks, use judgment.

### 1. Think Before Coding

Don't assume. Don't hide confusion. Surface tradeoffs.

Before implementing:
- State your assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them — don't pick silently.
- If a simpler approach exists, say so. Push back when warranted.
- If something is unclear, stop. Name what's confusing. Ask.

### 2. Simplicity First

Minimum code that solves the problem. Nothing speculative.

- No features beyond what was asked.
- No abstractions for single-use code.
- No "flexibility" or "configurability" that wasn't requested.
- No error handling for impossible scenarios.
- If you write 200 lines and it could be 50, rewrite it.

Ask yourself: "Would a senior engineer say this is overcomplicated?" If yes, simplify.

### 3. Surgical Changes

Touch only what you must. Clean up only your own mess.

When editing existing code:
- Don't "improve" adjacent code, comments, or formatting.
- Don't refactor things that aren't broken.
- Match existing style, even if you'd do it differently.
- If you notice unrelated dead code, mention it — don't delete it.

When your changes create orphans:
- Remove imports/variables/functions that YOUR changes made unused.
- Don't remove pre-existing dead code unless asked.

The test: Every changed line should trace directly to the user's request.

### 4. Goal-Driven Execution

Define success criteria. Loop until verified.

Transform tasks into verifiable goals:
- "Add validation" → "Write tests for invalid inputs, then make them pass"
- "Fix the bug" → "Write a test that reproduces it, then make it pass"
- "Refactor X" → "Ensure tests pass before and after"

For multi-step tasks, state a brief plan:
1. [Step] → verify: [check]
2. [Step] → verify: [check]
3. [Step] → verify: [check]

Strong success criteria let you loop independently. Weak criteria ("make it work") require constant clarification.

---

## Code Conventions

### TypeScript
- **Strict mode everywhere.** `"strict": true` in all tsconfig files.
- **No `any` types.** Ever. Use `unknown` + narrowing, or define the type.
- **No `@ts-ignore`.** Fix the type error instead.
- Prefer `type` over `interface` for simple shapes. Use `interface` for extendable contracts.

### File naming
- Components: `PascalCase.tsx` — e.g. `LoadCard.tsx`
- Utilities / services: `camelCase.ts` — e.g. `loadScoring.ts`
- NestJS modules: `kebab-case/` folder — e.g. `rate-analysis/`
- Zod schemas: `camelCase.schema.ts` in `packages/shared/schemas/`

### Database (Prisma)
- All models use `String @id @default(uuid())` — never auto-increment integers
- Soft deletes: `deleted_at DateTime?` on all business tables
- Every table has `company_id` for multi-tenancy
- Indexes: always index `(company_id, status)` on operational tables
- Table names: snake_case via `@@map`

### API (NestJS)
- Every controller extracts `companyId` from the JWT via `CompanyGuard` — never trust a companyId from the request body
- All endpoints return typed responses using shared Zod schemas
- Use class-validator + class-transformer for DTO validation on incoming requests
- BullMQ jobs: every job payload must include `companyId`

### Frontend (Next.js)
- Server Components for data fetching — no `useEffect` for initial data
- Client Components only for: interactive state, Supabase realtime subscriptions, form inputs
- Forms: react-hook-form + Zod resolver — schemas from `packages/shared`
- No direct Prisma imports in `apps/web` — all data goes through `apps/api`

### AI Agents
- Temperature `0` for decisions (scoring, ranking, classification)
- Temperature `0.3` for drafts (messages, counteroffers)
- Every Claude API call → create an `AiTask` record (input, output, model, tokens, latency, status)
- Tool calls, not free-text outputs — all agents use structured tool definitions
- On failure: mark `AiTask` as FAILED, log the error, do NOT throw (swallow and alert dispatcher)
- Human approval gates: any agent action that talks to a broker or commits a load → pause for dispatcher click

### Testing
- Unit tests: Vitest
- API integration tests: Supertest
- Test file location: co-located `*.spec.ts` next to the file under test
- Run with: `pnpm test`

---

## Environment Variables

All secrets live in `.env.local` (never committed). Required variables:

```bash
# Supabase
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_KEY=
DATABASE_URL=              # pooled connection (Prisma)
DIRECT_URL=                # direct connection (migrations only)

# AI
ANTHROPIC_API_KEY=

# External APIs
EIA_API_KEY=               # Free — eia.gov/opendata — for diesel price

# Messaging
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_WHATSAPP_FROM=      # e.g. whatsapp:+14155238886 (sandbox)

# Infrastructure
UPSTASH_REDIS_URL=

# Email inbound
SENDGRID_API_KEY=

# Observability
SENTRY_DSN=

# Next.js public (safe to expose to browser)
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

---

## AI Agent Responsibilities

| Agent | NestJS Module | Queue | Triggered by |
|---|---|---|---|
| Intake Agent | `intake/` | `intake-queue` | Inbound email webhook |
| Rate Analysis Agent | `rate-analysis/` | `analysis-queue` | `load.created` event |
| Dispatch Agent | `dispatch/` | `dispatch-queue` | `load.accepted` event |
| Driver Comms Agent | `communication/` | `communication-queue` | `dispatch.approved` event |
| Negotiation Agent | `negotiation/` | `negotiation-queue` | Phase 3 — not in MVP v0.1 |
| Finance Agent | `finance/` | `finance-queue` | Phase 3 — not in MVP v0.1 |

---

## What NOT to Build in MVP v0.1

Do not add these features under any circumstances until we have 50 paying customers.
If a task touches any of these, stop and ask.

| Feature | Why it's banned |
|---|---|
| Voice AI (Vapi / Retell / ElevenLabs) | TCPA compliance complexity; not needed to prove value |
| Autonomous dispatch (AI books load without approval) | Trust must be earned with data first |
| Invoice generation / Finance Agent | Phase 3 feature — not blocking first customers |
| GPS / ELD integration | Carriers will enter HOS manually for MVP |
| Mobile app (React Native) | Web-first; dispatcher works on desktop |
| DAT / Truckstop API (paid) | Use broker email ingestion first — it's free and unblockable |
| Customer portal (shipper-facing) | Not needed until we have customers |
| Multi-language support | US English only for MVP |
| Broker marketplace / two-sided features | Phase 4+ vision |
| AI that emails or calls brokers autonomously | Supervised only in v1.0 |

---

## Data Model — Key Tables

```
companies       → tenants (one row per carrier)
users           → dispatchers + owners (role: OWNER | DISPATCHER | VIEWER)
drivers         → driver roster with HOS, location, status
trucks          → fleet with type and availability
brokers         → broker contacts with payment history + blacklist
loads           → the core entity (status: PENDING → SCORED → ACCEPTED → ASSIGNED → ... → DELIVERED)
load_events     → append-only status history (audit trail)
messages        → all inbound/outbound WhatsApp/SMS/email
ai_tasks        → every Claude API call logged (input, output, tokens, latency, override)
invoices        → Phase 3
```

Multi-tenancy: every table has `company_id`. Supabase RLS enforces tenant isolation.
The `ai_tasks` table is critical — every dispatcher override is a training example.

---

## Claude Code Session Rules

When starting a new session, Claude Code should:

1. **Read this file first** before touching any code
2. **Read the relevant module files** before editing them — never edit blind
3. **One task at a time** — complete and test before moving to the next
4. **Show the diff / list files changed** after every task
5. **TypeScript errors are blockers** — run `pnpm typecheck` and fix before finishing
6. **Never modify** `.env.local`, `prisma/migrations/`, or `CLAUDE.md` without being explicitly asked

When generating code:
- Match the existing file and naming conventions exactly
- Use the shared Zod schemas from `packages/shared` — do not define schemas inline in controllers or components
- Always add the `companyId` guard to new API endpoints
- Always create an `AiTask` record for new Claude API calls

---

## Key Commands

```bash
# Development
pnpm dev                        # Start both web + api

# Apps individually
pnpm --filter web dev
pnpm --filter api dev

# Database
pnpm --filter api db:migrate    # Run migrations
pnpm --filter api db:studio     # Open Prisma Studio
pnpm --filter api db:seed       # Seed demo data

# Quality
pnpm lint                       # ESLint all packages
pnpm typecheck                  # TypeScript check all packages
pnpm test                       # Run all tests

# Build
pnpm build                      # Build all packages
```

---

## Phase Roadmap (reference only — do not build ahead)

| Phase | Timeline | Headline |
|---|---|---|
| **v0.1 (NOW)** | Weeks 1–8 | Rate-con parser + load scoring + driver board + WhatsApp dispatch |
| v0.5 | Weeks 9–20 | DAT integration + broker contact DB + negotiation assist + lane analytics |
| v1.0 | Weeks 21–36 | Supervised broker calling + Finance Agent + carrier rules engine |
| v2.0 | Month 9–18 | Semi-autonomous dispatch + proprietary lane data moat |
| v3.0 | Month 18+ | Fully autonomous operations + broker marketplace |

---

## Success Criteria for MVP v0.1

The MVP is done when ALL of the following are true:

- [ ] Broker email → Load record created with >95% field accuracy
- [ ] Every load auto-scored (GOOD / MARGINAL / AVOID) within 10 seconds
- [ ] Driver can be assigned with one click from the dispatcher board
- [ ] WhatsApp message sent to driver within 30 seconds of assignment
- [ ] Driver YES reply → load status updates automatically
- [ ] No cross-tenant data leakage (tested with two separate company accounts)
- [ ] Sentry capturing errors in both apps
- [ ] First customer demo completed
- [ ] First $300/month invoice sent

---

## Current Session State
> Last updated: June 2026 — update this section at the end of every session.

### Week 1 Gate Status
| Task | Status |
|---|---|
| `pnpm dev` starts web + api without errors | ✅ Done |
| `prisma migrate deploy` succeeds against Supabase | ✅ Done — `init_schema` migration applied |
| Login/signup works end-to-end | ✅ Done — tested locally |
| CI pipeline passes on a test PR | ⏳ Blocked — GitHub account billing issue |
| Both apps deployed to staging | ✅ Web live — Railway API in progress |

### Staging URLs
- **Web (Vercel):** https://aitms-web.vercel.app
- **API (Railway):** pending — Railway project `amused-integrity`, deploying

### Railway Deploy Status
- Multiple crash-fix iterations completed
- Current blocker: `@supabase/supabase-js` requires WebSocket on Node < 22
- Fix applied: `globalThis.WebSocket` polyfill via `ws` package in `apps/api/src/main.ts`
- `NODE_VERSION=20` set as Railway env var
- Latest deploy ID: `2ae80ecf` — awaiting result

### What's Next (Week 2)
1. Confirm Railway API is running — get public URL
2. Update `NEXT_PUBLIC_API_URL` on Vercel to Railway URL
3. Test signup end-to-end on staging
4. Build **Intake Agent** — `apps/api/src/intake/` module:
   - `POST /intake/email` webhook (SendGrid inbound parse)
   - Claude parses email → extracts load fields
   - Creates `Load` record with status `PENDING`
5. Build **Rate Analysis Agent** — auto-scores load on creation

### Key Decisions Made
- Supabase new-format keys (`sb_publishable_` / `sb_secret_`) used — not legacy JWT keys
- Railway project name: `amused-integrity` (auto-generated)
- Vercel project name: `aitms-web` linked at monorepo root
- `prisma generate` runs inside `pnpm --filter @aitms/api build` script
- `ws` package added to `@aitms/api` for Node 18/20 WebSocket polyfill