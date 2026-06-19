# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.
# Devsphinx AI Dispatch — Project Constitution

> This file is read by Claude Code at the start of every session.
> Keep it updated as the project evolves.
> Last updated: June 16 2026 · Phase: MVP v0.1 — COMPLETE, pre-demo

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

- [x] Broker email → Load record created with >95% field accuracy — Week 3 gate passed
- [x] Every load auto-scored (GOOD / MARGINAL / AVOID) within 10 seconds — Week 3 gate passed
- [x] Driver can be assigned with one click from the dispatcher board — PR #26 merged
- [x] WhatsApp message sent to driver within 30 seconds of assignment — confirmed PR #28
- [x] Driver YES reply → load status updates automatically — PR #27 (parse-driver-reply agent)
- [x] No cross-tenant data leakage (tested with two separate company accounts) — Task 8.2, PR #36
- [x] Sentry capturing errors in both apps — Task 8.1, PR #35
- [ ] First customer demo completed
- [ ] First $300/month invoice sent

---

## Current Session State
> Last updated: June 19 2026 — Security hardening pass merged. MVP v0.1 feature-complete. Next: first customer demo.

### Git Workflow (adopted Week 3)
- **Never push directly to `main`** — every commit, including small fixes, test files, and docs, must go through a feature branch and PR. No exceptions.
- Branch naming: `feat/task-X.Y-short-description`
- PR flow: push branch → `gh pr create` → CI gate → squash merge to main
- Set branch protection on `main` in GitHub (require CI status check) before next deploy

### Session June 19 2026 — Security Audit & Hardening
| Task | Status | PR |
|---|---|---|
| Twilio webhook signature validation — fail-closed when env unset (was fail-open) | ✅ Done | #52 |
| Inngest endpoint — boot-time assertion requires `INNGEST_SIGNING_KEY` in production | ✅ Done | #52 |
| Email webhook secret — `crypto.timingSafeEqual` instead of `!==` | ✅ Done | #52 |
| `parse-email` — re-derive tenant from persisted Message, abort on companyId mismatch (cross-tenant injection defense) | ✅ Done | #52 |
| CORS — restrict to `CORS_ORIGINS` allow-list (was `enableCors()` allow-all) | ✅ Done | #52 |
| chore — valid seed UUIDs, `onboarding_complete` flag, `.env*` + `.codex/` gitignore, array error toast | ✅ Done | #53 |
| feat — remove Settings + Support links from sidebar nav | ✅ Done | #43 |

**Audit notes:**
- `rate-analysis`, `dispatch`, `communication` Inngest functions were verified **already safe** — each fetches its entity by `{ id, company_id }`, so forged events can't cross tenants. No changes needed.
- The "secrets committed to Git" concern was **false** — `.env` is gitignored and was never committed.

**⚠️ Required production env vars (security fixes are inert without these):**
- `INNGEST_SIGNING_KEY` + `INNGEST_EVENT_KEY` — API now **refuses to boot in production** without the signing key (by design).
- `API_BASE_URL` (stable, not ngrok) + `TWILIO_AUTH_TOKEN` — or all Twilio webhooks are rejected (fail-closed).
- `CORS_ORIGINS` — comma-separated web origin(s); defaults to `http://localhost:3000`.

**⚠️ CI caveat:** GitHub Actions still fails to run (billing/runner issue — job runs 0 steps in ~4s). PRs #52/#53/#43 were merged with `--admin` to bypass the infra-failed check after local `typecheck` + 31/31 tests passed. **Fix GitHub billing so CI runs green before relying on the gate.**

**Follow-up deferred:** rate limiting on `/webhooks/*` (`@nestjs/throttler`) — DoS hardening, not a launch blocker.

### Session June 15 2026 — UI & Security Polish
| Task | Status | PR |
|---|---|---|
| Task 8.1 — Sentry error tracking (api + web) + pino structured logging | ✅ Done | #35 |
| Task 8.2 — Multi-tenant isolation audit (company_id guards, RLS policies, isolation tests) | ✅ Done | #36 |
| Task 8.3 — Idempotent Apex Freight LLC demo seed (all load board columns, ai_score_details shape) | ✅ Done | #37 |
| Task 8.4 — Redesign Add Driver + Add Truck drawers (fixed header, scrollable body, sticky footer) | ✅ Done | #38 |
| feat — Sidebar logout button | ✅ Done | #39 |
| feat — Sidebar user tile + dropdown menu (Settings + Log out) | ✅ Done | #40 |
| feat — Merge task 6 branch (assign load, status progression, POD upload, event timeline) | ✅ Done | #26 |

### No open PRs — main is current as of June 19 2026

### Week 7 Status
| Task | Status |
|---|---|
| Task 7.1 — TwilioService, phone util, POST /webhooks/twilio inbound handler, Message schema restructure | ✅ Done — merged to main (PR #27) |
| Task 7.2 — Communication Agent (send-assignment-message, parse-driver-reply), AI provider extensions, frontend notifications | ✅ Done — merged to main (PR #27) |
| fix: `assignDriver` missing `load/assigned` Inngest event (WhatsApp never fired) | ✅ Done — merged to main (PR #28) |
| fix: Twilio sandbox daily limit causing Inngest retry loop + duplicate messages | ✅ Done — merged to main (PR #28) |
| fix: `parse-email` event used `body` field — function expects `textBody` | ✅ Fixed (send test events with `textBody`) |
| fix: `send-assignment-message` skipped — load not in ASSIGNED status guard | ✅ Fixed (assign via UI or SQL first) |

### Week 7 Gate — PASSED (June 16 2026)
| Check | Result |
|---|---|
| `send-assignment-message` fires after dispatcher assigns driver | ✅ — fixed in PR #28 |
| WhatsApp message received within 30s | ✅ — confirmed (hit sandbox daily limit after) |
| Twilio 403 on inbound reply (ngrok URL mismatch) | ✅ — fix: set `API_BASE_URL=<ngrok-url>` in `apps/api/.env` |
| Reply YES → `driver_confirmed_at` set, DRIVER_ACCEPTED toast | ✅ — parse-driver-reply agent, PR #27 |
| Reply NO → load reverts to ACCEPTED, DRIVER_DECLINED alert | ✅ — PR #27 |
| No reply 30min → DRIVER_NO_REPLY alert | ✅ — PR #27 |
| Message records for all inbound + outbound | ✅ — Message schema, PR #27 |

### Local Testing Notes (Week 7 Gate)
- **ngrok** must be running: `ngrok http 3001` — exposes local API for Twilio inbound webhooks
- `API_BASE_URL` in `apps/api/.env` must match current ngrok URL (changes on every ngrok restart)
- Twilio sandbox webhook: Messaging → Try it out → Send a WhatsApp message → "When a message comes in" → `https://<ngrok-url>/webhooks/twilio`
- Twilio sandbox has **5 message/day limit** — `MessagingService` now catches this and returns a skipped result instead of throwing (no retry loop)
- End-to-end test event for Inngest Dev Server:
  ```json
  { "name": "load/email.received", "data": { "messageId": "test-msg-001", "companyId": "5fd3428b-775a-4eb8-9c6d-517cf72b5b16", "fromEmail": "dispatch@echogloballogistics.com", "subject": "Rate Confirmation - New York to Chicago", "textBody": "Pickup: New York, NY on June 15 2026. Delivery: Chicago, IL. Load type: Flatbed. Weight: 42000 lbs. Rate: $2200.", "attachments": [] } }
  ```
- John Smith driver: `ca537a94-4d16-4475-8790-c0461649a406` · truck LOWBOY T-105 · WhatsApp `+923100170459` · eligible for FLATBED/STEP_DECK loads

### Week 6 Status
| Task | Status |
|---|---|
| Task 6.1 — Assign Load endpoint + Dispatch Recommendations Panel | ✅ Done |
| Task 6.2 — Status progression (AT_PICKUP→LOADED→EN_ROUTE→DELIVERED) + POD upload + EventTimeline rewrite | ✅ Done |
| fix: "Assign This Driver" button was opening override modal instead of assigning directly | ✅ Done |

### Week 6 Gate — PASSED (June 16 2026)
| Check | Result |
|---|---|
| Accept load → Dispatch Recommendations Panel appears with ranked drivers | ✅ — PR #26 merged |
| "Assign This Driver" assigns directly without opening modal | ✅ — PR #26 |
| Override picker opens, shows all AVAILABLE drivers, Select assigns correctly | ✅ — PR #26 |
| ASSIGNED load → "Mark At Pickup" button visible and works | ✅ — PR #26 |
| EN_ROUTE load → "Mark Delivered + Collect POD" opens Sheet, upload + confirm works | ✅ — PR #26 |
| POD signed URL saved on load record, "View POD" link in Timeline | ✅ — PR #26 |
| Timeline shows events newest-first, correct actor labels (You / AI Agent / Dispatcher) | ✅ — PR #26 |
| `load/assigned` and `load/delivered` events visible in Inngest Dev Server | ✅ — PR #26 |

### Migrations pending (run in Supabase SQL Editor)
- `20260612100000_add_assignment_fields` — adds `assigned_by_user_id`, `assigned_at` to loads; `company_id`, `actor_name` to load_events
- `20260612200000_add_pod_url` — adds `pod_document_url` to loads
- Supabase Storage bucket `pods` must be created manually (Dashboard → Storage → New bucket, public=false)

### Task 6.1 — Assign Load

#### API additions (`apps/api/src/loads/`)
- `POST /loads/:id/assign` — pre-flight checks (load=ACCEPTED, driver=AVAILABLE, HOS>0, truck≠OUT_OF_SERVICE) → single `$transaction` (load→ASSIGNED, driver→ON_LOAD, truck→IN_USE, LoadEvent) → `load/assigned` Inngest event
- `dto/assign-load.dto.ts` — `@IsUUID driver_id`, `@IsUUID truck_id`

#### Shared schema
- `assignLoadSchema` + `AssignLoadInput` added to `packages/shared/src/schemas/load.schema.ts`

#### Frontend additions
- `apps/web/src/app/api/loads/[id]/assign/route.ts` — Next.js proxy
- `apps/web/src/components/ui/dialog.tsx` — new shadcn Dialog component (uses existing `@radix-ui/react-dialog`)
- `apps/web/src/components/loads/DispatchRecommendationsPanel.tsx` — up to 3 ranked driver cards with direct Assign button, spinner when rankings generating, Override picker Dialog (sort by HOS or Name)
- `apps/web/src/components/loads/types.ts` — added `assigned_by_user_id`, `assigned_at`, `pod_document_url`; fixed `truck_number` → `unit_number`

#### Dispatch enrichment fix
- `dispatch.types.ts` — added `truck_id`, `truck_unit_number`, `truck_type` to `RankedDriver`; added `truck_unit_number` to `DriverCandidate`
- `dispatch.functions.ts` — enrichment now persists `truck_id`, `truck_unit_number`, `truck_type` into `ai_score_details.driver_rankings` so the Assign button has a truck_id to send

### Task 6.2 — Status Progression + POD + Timeline

#### API changes
- `ALLOWED_TRANSITIONS` extended: `PENDING→SCORED`, `ASSIGNED→AT_PICKUP→LOADED→EN_ROUTE→DELIVERED`
- `updateStatus` now accepts `podUrl?` param; writes `pod_document_url` on DELIVERED; creates typed LoadEvents (`event_type = newStatus` for new transitions, `STATUS_CHANGE` for legacy); fires `load/delivered` Inngest event (fire-and-forget)
- `LoadEvent` ordering changed to `desc` in `LOAD_DETAIL_INCLUDE`

#### Frontend additions
- `apps/web/src/components/loads/StatusProgressionPanel.tsx` — renders next-action button for ASSIGNED/AT_PICKUP/LOADED/EN_ROUTE; DELIVERED opens a Sheet with file upload → Supabase Storage → signed URL → PATCH /status
- `apps/web/src/components/loads/EventTimeline.tsx` — rewritten: actor labels (You/Dispatcher/AI Agent/Driver/System), human-readable event descriptions, colored dots, "View POD" link, newest-first sort
- `LoadDetail.tsx` — wired `StatusProgressionPanel` and passed `currentUserId` to `EventTimeline`

### Week 5 Status
| Task | Status |
|---|---|
| Task 5.1 — Driver & Fleet board (GET /drivers, GET /trucks, driver availability UI) | ✅ Done — merged to main |
| Task 5.2 — Dispatch Agent (`load/accepted` → rank-drivers → save to ai_score_details) | ✅ Done — merged to main (PR #14) |
| Week 5 Gate fixes — hard HOS + equipment pre-filters, seed 4 drivers | ✅ Done — merged to main |
| fix: driver names showing UUID instead of full name | ✅ Done — merged to main (PR #19) |
| fix: deadhead miles + ETA blank on recommendations | ✅ Done — merged to main (PR #20) |
| fix: hydration mismatch on EventTimeline date formatting | ✅ Done — merged to main (PR #21) |
| fix: `attachments.filter` TypeError when payload has no attachments | ✅ Done — merged to main |
| fix: load detail auto-refresh (poll every 5s when ACCEPTED, no rankings yet) | ✅ Done — merged to main (PR #23) |
| fix: dashboard board auto-refresh (poll every 8s when PENDING/ACCEPTED loads exist) | ✅ Done — merged to main (PR #24) |

### Week 5 Gate — PASSED (June 12 2026)
| Check | Result |
|---|---|
| `rank-drivers` visible in Inngest Dev Server | ✅ |
| Accept a load → top driver recommendations appear on load detail page | ✅ — auto-refresh, no reload needed |
| HOS filter blocks driver with <required hours | ✅ — Tanya Williams (4h) blocked |
| Equipment filter blocks flatbed driver for dry van load | ✅ — Dale Cooper (FLATBED) blocked |
| AiTask logged for every dispatch ranking call | ✅ |
| Load scored (PENDING→SCORED) appears on dashboard without reload | ✅ — 8s polling fallback |

### Week 4 Gate — PASSED (June 11 2026)
| Check | Result |
|---|---|
| Login → redirects to `/dashboard` (load board) | ✅ |
| Load board renders kanban columns with live data | ✅ — 8 active loads, 2 scored with GOOD badge |
| Supabase Realtime green dot visible | ✅ |
| Stats bar shows Active Loads, Need Assignment, Drivers Available, Avg RPM | ✅ |
| GET /loads/stats returns correct counts | ✅ |
| PATCH /loads/:id/status validates transitions (PENDING→ACCEPTED blocked) | ✅ |
| GET /loads/:id (detail) works after `truck_number`→`unit_number` fix | ✅ |
| NeedsReviewBanner + useNotifications wired | ✅ (requires actual needs_review load to appear) |

### Week 3 Gate — PASSED (June 11 2026)
| Check | Result |
|---|---|
| `score-load` visible in Inngest Dev Server | ✅ |
| Load created → `status = SCORED` within 10s | ✅ |
| GOOD/MARGINAL/AVOID logic correct vs manual calc | ✅ — "RPM 2.72 well above minimum 1.8, strong profit margin" |
| Carrier settings saved and used in scoring | ✅ |
| AiTask record created for every scoring call | ✅ |
| EIA diesel price cache | ⚠️ Using $3.85 fallback — restart API after adding EIA_API_KEY to pick up live price |

### Task 4 — Load Board UI + Notifications

#### API additions (`apps/api/src/loads/`)
- `GET /loads` — returns active loads for company (excludes CANCELLED/PAID/INVOICED by default; `?status=ACTIVE` also works)
- `GET /loads/stats` — `{ total_active, needs_assignment, drivers_available, todays_avg_rpm }`
- `GET /loads/:id` — full load detail with broker, driver, truck, events, messages (via `LOAD_DETAIL_INCLUDE`)
- `PATCH /loads/:id/status` — validates transitions via `ALLOWED_TRANSITIONS` map; `UpdateStatusDto` with `@IsEnum(LoadStatus)`
- `PATCH /loads/:id/reviewed` — clears `needs_review` flag
- Bug fix: `LOAD_DETAIL_INCLUDE` uses `unit_number` (not `truck_number`) for Truck relation

#### Frontend additions (`apps/web/src/`)
- `hooks/useLoads.ts` — groups loads into kanban columns, fetches stats on mount
- `hooks/useLoadsBoardRealtime.ts` — single Supabase postgres_changes channel, accepts `onLoadChange` + `onNotificationEvent` callbacks; retries on CHANNEL_ERROR
- `hooks/useNotifications.ts` — derives NEW_LOAD and NEEDS_REVIEW events from load changes; separate broadcast channel for DRIVER_NO_REPLY; max 20 notifications
- `components/board/LoadBoard.tsx` — wires hooks, renders kanban columns, always-visible: PENDING/SCORED/ACCEPTED/ASSIGNED/EN_ROUTE
- `components/board/LoadCard.tsx` — shows origin→dest, rate, RPM, AI score badge, broker, driver
- `components/board/StatsBar.tsx` — 4 stat chips
- `components/loads/AiAnalysisPanel.tsx` — score badge, reasoning, RPM bar, uses `safeParse` (never crashes on bad AI data)
- `components/loads/CounterOfferPanel.tsx` — Shadcn Sheet from right, editable rate, clipboard copy
- `components/notifications/NeedsReviewBanner.tsx` — amber banner, links to `?filter=needs_review`
- `app/(dashboard)/dashboard/page.tsx` — server component, SSR fetches loads, wraps LoadBoard in `<Suspense>`
- `app/(dashboard)/loads/[id]/page.tsx` — load detail page
- `lib/supabase/client.ts` — browser Supabase client for Realtime

#### Architecture decision: one Realtime channel, two consumers
`useLoadsBoardRealtime` owns the single `loads:company:${companyId}` postgres_changes subscription. It accepts an optional `onNotificationEvent` callback so `useNotifications` can piggyback without opening a second WebSocket.

#### Bug fixes shipped (PR #13)
- Root `page.tsx` was an empty `<div>` — now redirects to `/dashboard`
- Middleware redirected logged-in users to `/` instead of `/dashboard`
- `LOAD_DETAIL_INCLUDE` used `truck_number` (not in schema) → fixed to `unit_number`

### Task 5 — Dispatch Agent + Driver Board

#### Dispatch Agent (`apps/api/src/dispatch/`)
- `dispatch.types.ts` — `LoadAcceptedEventData`, `DriverCandidate`, `RankedDriver`, `RankDriversToolOutput`
- `state-distances.ts` — Haversine formula over state centroids × 1.3 road factor; works for any US state pair; never returns null for known states
- `dispatch.functions.ts` — `createRankDriversFunction(prisma, aiProvider)`
  - Trigger: `load/accepted` | retries: 2
  - Step 1 `fetch-context`: load + AVAILABLE drivers + **hard HOS pre-filter** (need ≥ `ceil(miles/55) + 2`h) + **hard equipment pre-filter** (DRY_VAN/REEFER load requires DRY_VAN/REEFER truck; FLATBED/STEP_DECK requires FLATBED/STEP_DECK/LOWBOY) + deadhead miles pre-computed per driver
  - Step 2 `claude-rank`: `aiProvider.rankDrivers()` — `claude-haiku-4-5`, temp 0, forced tool_choice `rank_drivers` → returns ranked list with scores/reasons
  - Enrichment (outside step.run): driver names + deadhead/ETA overwritten from TypeScript data — Claude only returns `driver_id`
  - Step 3 `save-rankings`: `findUnique` outside transaction + `$transaction([aiTask.create, load.update])` array form (avoids 5s PgBouncer interactive timeout)
  - Step 4: emit `load/drivers-ranked`
- Registered in `InngestModule` alongside `parse-email`, `score-load`, `clean-cache`

#### AiProvider interface update
- Added `rankDrivers(params: { system: string; userMessage: string }): Promise<RankDriversResult>`
- Both `AnthropicProvider` and `OpenRouterProvider` implement all 3 methods
- `intake.functions.spec.ts` mock must include `rankDrivers: jest.fn()`

#### Frontend additions — Driver Recommendations
- `components/loads/DriverRecommendations.tsx` — reads `ai_score_details.driver_rankings`; shows rank badge (color-coded), score bar, reason, deadhead/ETA
- `hooks/useLoadDetailRealtime.ts` — Supabase postgres_changes on single load row (unreliable for `id=eq.{uuid}` — polling fallback added)
- `app/(dashboard)/loads/[id]/LoadDetail.tsx` — `refetch` callback + `useLoadDetailRealtime` + polling fallback: polls every 5s when `status === ACCEPTED` and no `driver_rankings` yet; stops after 90s or when rankings appear

#### Dashboard auto-refresh fix (PR #24)
- `hooks/useLoads.ts` — 8s polling loop when any PENDING/ACCEPTED loads exist; merges fresh data from `/api/loads` via `mergeFreshLoads`; stops when no qualifying loads remain
- `components/board/LoadBoard.tsx` — Realtime INSERT/UPDATE now triggers full `/api/loads` fetch (raw payload lacks joins); raw payload used as fallback if fetch fails

#### Seed data (`apps/api/prisma/seed.ts`) — 4 drivers for gate testing, company `5fd3428b-775a-4eb8-9c6d-517cf72b5b16`
| Driver | State | Truck | HOS | Gate result |
|---|---|---|---|---|
| Marcus Johnson | IL | DRY_VAN T-101 | 65h | ✅ Eligible |
| Rosa Martinez | TX | REEFER T-102 | 48h | ✅ Eligible |
| Dale Cooper | GA | FLATBED T-103 | 55h | ❌ Equipment-blocked (dry van load) |
| Tanya Williams | IN | DRY_VAN T-104 | 4h | ❌ HOS-blocked |

#### Key bug fixes shipped this session
- `enrichedRanked` defined outside `step.run` so it's in scope for Step 4 `sendEvent`
- `InputJsonValue` cast: `as unknown as Prisma.InputJsonValue` for JSONB merge
- `attachments` defaulted to `[]` in destructuring: `attachments = []` — prevents `TypeError: attachments.filter is not a function` when Inngest Dev Server omits the field
- Hydration mismatch in `EventTimeline`: replaced `toLocaleString()` with UTC-based manual formatter

### Task 3.1 — Carrier Cost Settings
- Schema: `packages/shared/src/schemas/company-settings.schema.ts` — `carrierCostSettingsSchema` + `CarrierCostSettings`
- DTO: `apps/api/src/companies/dto/update-cost-settings.dto.ts`
- API: `GET /companies/settings` + `PATCH /companies/settings` added to `CompaniesController`
  - `CompanyGuard` now also stamps `req.userRole` from JWT `app_metadata.role`
  - PATCH requires `userRole === 'OWNER'` — returns 403 otherwise
  - Merge strategy: `{ ...existingSettings, costs: dto }` — never overwrites sibling keys
  - TODO comment left for cache invalidation (`company:{id}:settings`) pending Task 3.3 CacheService
- Route handler: `apps/web/src/app/api/companies/settings/route.ts` — GET + PATCH proxy to NestJS
- UI: `apps/web/src/app/(dashboard)/settings/costs/page.tsx` (server) + `CostSettingsForm.tsx` (client)
  - Two shadcn Cards: "Cost Basis" and "Dispatch Rules"
  - Live break-even calc: `cost_per_mile + fuel_cost_per_mile + driver_pay_per_mile`
  - Amber warning when `minimum_rpm < all-in cost`
  - Read-only with notice banner for non-OWNER roles
  - New shadcn component: `apps/web/src/components/ui/card.tsx`
- Typecheck: 4/4 packages pass | Tests: 19/19 pass

### Task 3.2 — CacheService (Postgres-backed)
- Schema: `Cache` model added to `prisma/schema.prisma` — `key` (PK), `value` (JSON string), `expires_at`
- Migration: `apps/api/prisma/migrations/20260610000000_add_cache_table/migration.sql` — applied manually via Supabase SQL Editor + `_prisma_migrations` row inserted
- Service: `apps/api/src/cache/cache.service.ts` — `get<T>`, `set`, `del`; expired rows return null; parse errors evict the row
- Module: `apps/api/src/cache/cache.module.ts` — exports `CacheService`; imported in `AppModule` + `CompaniesModule`
- Cron: `apps/api/src/cache/cache.functions.ts` — `clean-cache` Inngest function, runs nightly at 03:00 UTC; registered in `InngestModule`
- `CompaniesService` updated: `cache.del('company:{id}:settings')` called on settings update (replaces previous TODO)
- Key conventions: `eia:diesel_price` TTL 86400 · `lane:{o}:{d}:{companyId}` TTL 3600 · `company:{id}:settings` TTL 300

### Task 3.3 — Rate Analysis Agent
- Types: `apps/api/src/rate-analysis/rate-analysis.types.ts` — `LoadCreatedEventData`, `LaneHistory`, `ScoringContext`, `LoadScoredEventData`
- EIA service: `apps/api/src/rate-analysis/eia.service.ts` — fetches weekly US diesel price from EIA API; 24hr cache; falls back to $3.85/gal on any failure (scoring never blocked). Key: `EIA_API_KEY` (free from eia.gov/opendata)
- Function: `apps/api/src/rate-analysis/rate-analysis.functions.ts` — `createScoreLoadFunction(prisma, aiProvider, cache, eia)`
  - Trigger: `load/created` | retries: 2
  - Step 1 `fetch-context`: load lookup + guards (not found / not PENDING / null rate / missing settings → `needs_review=true`) + costs cache-aside (TTL 300s) + lane history cache-aside (TTL 3600s, last 30 loads) + EIA diesel price + TypeScript math (all-in cost, RPM, estimated profit)
  - Step 2 `claude-score`: `aiProvider.scoreLoad()` — `claude-haiku-4-5`, temperature 0, forced `tool_choice: score_load` → returns GOOD/MARGINAL/AVOID + reason (≤12 words) + suggested_minimum_rate + counteroffer_rate
  - Step 3 `save-score`: `$transaction` — `updateMany where { id, status: PENDING }` race guard + `AiTask.create`
  - Step 4: `sendEvent 'load/scored'`
- Module: registered in `InngestModule` alongside `parse-email` and `clean-cache`; shares the same `aiProvider` instance
- Design principle: TypeScript computes all math; Claude only makes the GOOD/MARGINAL/AVOID judgment
- `ai_score` + `ai_score_details` (JSONB) fields were already in `init_schema` migration — no new migration needed

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
| Rate Analysis Agent — auto-score on `load.created` | ⏳ Week 3 Task 3.2 |
| Load Board UI — Supabase Realtime | ⏳ Week 3 Task 3.3 |

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
- System prompt v2 (June 10 2026): party disambiguation (broker vs shipper vs carrier), city/state extraction rules, relative-date resolution, rate = linehaul + FSC summed, load_type inference vocabulary, calibrated confidence anchors
- Today's date injected into user message (`TODAY'S DATE: YYYY-MM-DD (Weekday)`) so relative dates ("tomorrow", "6/16") can be resolved
- No-load skip: if parsed `confidence <= 0.2` (prompt defines 0 = no load in email), function returns `{ loadId: null, skipped: true }` without creating a Load — prevents garbage loads from spam/payment reminders
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
  OPENROUTER_MODEL=anthropic/claude-haiku-4-5   # recommended — scoring prompts tuned for it
  ```
- `google/gemini-flash-1.5` was removed from OpenRouter — **do not use**
- OpenRouter uses fetch + OpenAI-compatible API — no new npm packages
- Free tier models (`:free` suffix) are heavily rate-limited; paid models recommended for testing
- Native PDF document blocks (Anthropic-only) are skipped when using OpenRouter — text-only fallback
- `AiProvider` interface has three methods: `parseEmail()`, `scoreLoad()`, `rankDrivers()` — both providers implement all three
- Both `parse-email` and `score-load` Inngest functions use the same shared `aiProvider` instance from `InngestModule`
- To test intake without email: use Inngest Dev Server (http://localhost:8288) → Functions → `parse-email` → Send test event

### Testing Setup
- Framework: Jest + ts-jest (co-located `*.spec.ts` files)
- Run: `pnpm --filter @aitms/api test`
- 26 tests, 4 suites — all passing as of June 11 2026
- Test files:
  - `src/webhooks/webhooks.service.spec.ts` — 5 tests
  - `src/mail/mail.service.spec.ts` — 4 tests
  - `src/intake/intake.functions.spec.ts` — 10 tests
  - `src/cache/cache.service.spec.ts` — 7 tests
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

### Local Migration Workaround (port 5432 blocked)
`prisma migrate dev`, `prisma migrate deploy`, and `prisma migrate status` all require a direct connection to Supabase on port 5432. This port is blocked on the dev machine's network — all three commands fail with `P1001`. Railway (CI/deploy) is unaffected.

**Workflow for every new migration locally:**

1. Add the model to `prisma/schema.prisma`
2. Run `prisma generate` to update the client:
   ```bash
   pnpm --filter @aitms/api exec prisma generate
   ```
3. Manually create the migration file:
   ```
   apps/api/prisma/migrations/YYYYMMDDHHMMSS_migration_name/migration.sql
   ```
4. Run the SQL in **Supabase SQL Editor** (supabase.com/dashboard → SQL Editor)
5. Get the SHA-256 checksum of the migration file:
   ```bash
   sha256sum apps/api/prisma/migrations/<folder>/migration.sql
   ```
6. Insert the migration record in Supabase SQL Editor:
   ```sql
   INSERT INTO "_prisma_migrations"
     (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count)
   VALUES
     (gen_random_uuid()::text, '<checksum>', now(), '<migration_name>', NULL, NULL, now(), 1);
   ```

Runtime queries use `DATABASE_URL` (port 6543, pgbouncer) and are never affected.