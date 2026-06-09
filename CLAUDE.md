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

> Behavioral guidelines to reduce common LLM coding mistakes.
>
> **These rules are non-negotiable unless the user explicitly grants an exception.**

### 0. Rule Enforcement

- Follow ALL rules below on every single response — no exceptions unless the user says so.
- Do NOT ask for permission to follow the rules. Just follow them.
- If a task cannot be completed within the rules (e.g. a CLI is non-interactive, a config format is unclear):
  1. Try a different approach once.
  2. Try a second different approach once.
  3. If still stuck after 2 attempts — stop. Explain exactly what failed and give the user manual steps to do it themselves. Do NOT attempt a third automated approach.
- Never modify `CLAUDE.md` unless explicitly asked by the user.
- Never touch `.env` files, `prisma/migrations/`, or security-sensitive config unless explicitly asked.

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

# Inngest
pnpm --filter @aitms/api inngest:dev  # Start Inngest Dev Server → http://localhost:8288

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
> Last updated: June 8 2026 — update this section at the end of every session.

### Week 1 Gate Status
| Task | Status |
|---|---|
| `pnpm dev` starts web + api without errors | ✅ Done |
| `prisma migrate deploy` succeeds against Supabase | ✅ Done — `init_schema` migration applied |
| Login/signup works end-to-end | ✅ Done — tested locally and on staging |
| CI pipeline passes on a test PR | ⏳ Blocked — GitHub account billing issue |
| Both apps deployed to staging | ✅ Done — both live |

### Staging URLs
- **Web (Vercel):** https://aitms-web.vercel.app
- **API (Railway):** https://amused-integrity-production-dc29.up.railway.app

### Week 2 Status
| Task | Status |
|---|---|
| Inngest wired up (`/api/inngest`, client, module) | ✅ Done |
| Email ingestion — Cloudflare Worker + `POST /webhooks/email` | ✅ Done |
| Outbound email service (Resend) — `MailService` | ✅ Done |
| Intake Agent — parse email → Load record | ✅ Done — ANTHROPIC_API_KEY added; end-to-end test pending Anthropic credit top-up |
| Unit tests — WebhooksService, MailService, IntakeAgent | ✅ Done — 19/19 passing |
| Manual Load Entry form — Task 2.4 | ✅ Done — tested end-to-end locally |
| OpenRouter provider adapter | ✅ Done — toggle via AI_PROVIDER env var |
| Rate Analysis Agent — auto-score on `load.created` | ⏳ Next |
| Load Board UI — Supabase Realtime | ⏳ Next |

### Inngest Setup
- Package: `inngest` v4 installed in `apps/api`
- Client: `apps/api/src/inngest/inngest.client.ts` — id: `aitms-api`
- Endpoint: `ALL /api/inngest` — no auth guard
- Dev server: `pnpm --filter @aitms/api inngest:dev` → dashboard at http://localhost:8288
- Functions registered via `INNGEST_FUNCTIONS` token in `InngestModule` — factory pattern (not NestJS class DI)
- `INNGEST_DEV=1` must be set in `.env` for local dev (disables signing key requirement)
- Production keys: `INNGEST_SIGNING_KEY` + `INNGEST_EVENT_KEY` in `.env` (blank for local dev)

### Email Ingestion Setup
- Cloudflare Email Worker: `apps/cloudflare/email-worker.ts` — parses inbound email with `postal-mime`, POSTs to `WEBHOOK_URL`
- Worker deployed at: `https://aitms-email-worker.devsphinx.workers.dev`
- Cloudflare subdomain: `devsphinx.workers.dev` (registered)
- NestJS webhook: `POST /webhooks/email` — verifies `X-Webhook-Secret`, creates Message + Broker records, fires `load/email.received` Inngest event
- Company routing: `inbound_email` set to `info@devsphinx.dev` on Acme Trucking LLC (company id: `29c19f12-0d3b-4c30-8c4a-1f9c2d02eb60`)
- Migration applied: `20260604000000_add_company_inbound_email` — adds `inbound_email String? @unique` to Company
- Resend: `MailService` in `apps/api/src/mail/` — lazy-initializes, only for auth/alert/invoice emails
- New env vars: `WEBHOOK_SECRET` (must match Cloudflare Worker secret), `RESEND_API_KEY`
- Domain: `devsphinx.dev` purchased on Cloudflare Registrar — MX records configured, DNS propagation pending
- Email routing rule: `info@devsphinx.dev` → Worker `aitms-email-worker` (Active in Cloudflare dashboard)
- Status: ⏳ DNS propagating — `NXDOMAIN` still returning as of June 8 2026; email routing will work automatically once propagation completes (no code changes needed)

### Intake Agent Setup
- Module: `apps/api/src/intake/` — `intake.types.ts`, `intake.functions.ts`, `intake.module.ts`
- Pattern: factory function `createParseEmailFunction(prisma, anthropic)` — NOT a NestJS `@Injectable()`
- Inngest function id: `parse-email` | trigger: `load/email.received` | retries: 3
- Steps: `extract-pdf` → `claude-parse` → `create-db-records` → `trigger-scoring`
- Model: `claude-haiku-4-5` for text-only; auto-upgrades to `claude-sonnet-4-5` when fallback PDF document blocks are present
- PDF fallback: if `pdf-parse` throws or returns <50 chars, attachment goes into `claudeDocuments[]` and is sent as a native Claude `document` block (base64 PDF) — `claude-haiku-4-5` does NOT support document blocks, hence the model upgrade
- tool call: `create_load` | temperature: 0
- Schema migrations applied: `20260605000000_nullable_load_fields_add_needs_review`
  - `delivery_date`, `load_type`, `rate` now nullable on `Load`
  - `needs_review Boolean @default(false)` added to `Load`
- InngestController updated: accepts `INNGEST_FUNCTIONS` token via `@Inject()` — handler created in constructor
- Circular import fix: `INNGEST_FUNCTIONS` token lives in `inngest.tokens.ts` (not `inngest.module.ts`)
- New env vars: `ANTHROPIC_API_KEY`, `INNGEST_DEV=1`, `INNGEST_EVENT_KEY=local`

### Manual Load Entry Setup (Task 2.4)
- Form: `apps/web/src/app/(dashboard)/loads/new/` — `page.tsx` + `LoadForm.tsx` (client component)
- Auth: `apps/web/src/app/(dashboard)/layout.tsx` — checks session via `getSessionUser()`, redirects to `/login` if missing
- Route Handlers (proxy to NestJS): `apps/web/src/app/api/loads/route.ts`, `apps/web/src/app/api/brokers/route.ts`
- Shared: `packages/shared/src/schemas/load.schema.ts` — `createLoadSchema` + `CreateLoadInput`
- Shared: `packages/shared/src/utils/state-distances.ts` — `getEstimatedMiles(o, d)` — used client-side for live miles/RPM preview
- Shared: `packages/shared/src/utils/us-states.ts` — `US_STATES` constant (all 50 states)
- API: `apps/api/src/loads/` — `LoadsModule`, `LoadsController` (`POST /loads`), `LoadsService`
- API: `apps/api/src/brokers/` — `BrokersModule`, `BrokersController` (`GET /brokers`), `BrokersService`
- API: `apps/api/src/common/guards/company.guard.ts` — `CompanyGuard` — validates Bearer JWT via `supabase.auth.getUser()`, sets `req.companyId`
- New Shadcn component: `apps/web/src/components/ui/select.tsx`
- New web deps: `react-hook-form`, `@hookform/resolvers`, `@radix-ui/react-select`
- `@supabase/ssr` upgraded: `0.3.0` → `0.10.3` — **critical fix**: old version didn't support `sb_publishable_` key format, causing session cookies to never be written
- `DATABASE_URL` must have `?pgbouncer=true` appended — required for Prisma `$transaction` with Supabase's PgBouncer pooler
- On submit: form POSTs to `/api/loads` (Next.js Route Handler) → forwards to NestJS with Bearer token → `LoadsService` creates Load with `source: MANUAL` + fires `load/created` Inngest event
- Stub page: `apps/web/src/app/(dashboard)/loads/[id]/page.tsx` — redirect target after load creation

### OpenRouter Provider Setup
- Files: `apps/api/src/ai/` — `ai-provider.ts` (interface), `anthropic.provider.ts`, `openrouter.provider.ts`
- Toggle via env vars in `apps/api/.env`:
  ```
  AI_PROVIDER=openrouter        # omit or set to anything else → uses Anthropic
  OPENROUTER_API_KEY=sk-or-...
  OPENROUTER_MODEL=google/gemini-flash-1.5   # or any OpenRouter model ID
  ```
- OpenRouter uses fetch + OpenAI-compatible API — no new npm packages
- Free tier models (`:free` suffix) are heavily rate-limited; paid models recommended for testing
- Native PDF document blocks (Anthropic-only) are skipped when using OpenRouter — text-only fallback
- Intake Agent now accepts `AiProvider` interface instead of `Anthropic` directly — fully decoupled
- To test intake without email: use Inngest Dev Server (http://localhost:8288) → Functions → `parse-email` → Send test event

### Testing Setup
- Framework: Jest + ts-jest (co-located `*.spec.ts` files)
- Run: `pnpm --filter @aitms/api test`
- 19 tests, 3 suites — all passing as of June 7 2026
- Test files:
  - `src/webhooks/webhooks.service.spec.ts` — 5 tests
  - `src/mail/mail.service.spec.ts` — 4 tests
  - `src/intake/intake.functions.spec.ts` — 10 tests
- Jest config lives in `apps/api/package.json` under `"jest"` key

### Key Decisions Made
- Supabase new-format keys (`sb_publishable_` / `sb_secret_`) used — not legacy JWT keys
- Railway project name: `amused-integrity` (auto-generated)
- Vercel project name: `aitms-web` linked at monorepo root — `.vercel/` is gitignored, re-run `vercel link --project aitms-web` in a new machine
- `prisma generate` runs inside `pnpm --filter @aitms/api build` script (baked into `apps/api/package.json` build script)
- `ws` package added to `@aitms/api` for Node 18/20 WebSocket polyfill
- Supabase email confirmation disabled (dev mode) — re-enable before first real customer
- `next@14.2.35` — upgraded from 14.2.3 due to Railway security vulnerability check (CVE-2025-55184, CVE-2025-67779)
- `railpack.json` at monorepo root controls Railway build — do not delete
- `vercel.json` at monorepo root controls Vercel build — do not delete
- Node.js version: local uses nvm 24 (`nvm use 24`), Railway uses Node 20 (`NODE_VERSION=20` env var set)

### Infrastructure Quick Reference
| Service | Project | How to redeploy |
|---|---|---|
| Web | Vercel `aitms-web` | `vercel --prod` from repo root |
| API | Railway `amused-integrity` | `railway up --detach` from repo root |
| DB | Supabase `AITMS` | `pnpm --filter @aitms/api db:migrate` |