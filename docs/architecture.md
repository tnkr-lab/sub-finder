# SubFill — Architecture Document

**Status:** Week 2 scaffold complete · Week 3 (security hardening) in progress  
**Last updated:** 2026-06-16

---

## What It Is

SubFill is a B2B2C web service (PWA, no native app) that eliminates the morning phone-tree chaos of finding substitute cover. An administrator posts an open slot in ~30 seconds. Claude ranks the substitute pool and returns scored recommendations with reasoning. The admin chooses a notification scope (top match, top 3, or whole pool). Substitutes receive a push notification and an SMS simultaneously. The first to tap Claim wins — enforced atomically at the database layer. Every other substitute sees the slot stamped FILLED in real time without a page refresh. Admin dashboard confirms who claimed and when. Total elapsed time, admin to confirmation: target under 10 minutes. Zero phone calls.

Target users: small-to-mid organisations (schools, care homes, small businesses) with a substitute pool of 8–20 people who currently coordinate cover by group text or phone tree.

---

## Architecture Shape

**Trigger check result: 1–2 triggers.** No long-running processes, no queues, no caching layer, one data store, one client type (web/PWA), one builder. The only active triggers: 5 external integrations, and an intended commercial lifespan beyond 1 year.

This is a lean-architecture situation. The document is sized to match — no unnecessary layers, no diagrams for things that are obvious from the code, no speculative future-proofing.

---

## Stack

| Layer | Technology | Notes |
|---|---|---|
| Framework | Next.js 14 (App Router) + TypeScript | Serverless functions on Vercel |
| Styling | Tailwind CSS | |
| Database | Supabase (PostgreSQL) | Auth + Realtime included |
| AI | Anthropic SDK — `claude-sonnet-4-6` | Forced `tool_use` output, no free-text path |
| Push notifications | Web Push API + VAPID (`web-push` library) | Service worker at domain root |
| SMS | Twilio | Parallel to push; failure-tolerant |
| Hosting | Vercel (free tier) | |
| Testing | Playwright | |

---

## Project Structure

```
app/
  (auth)/          login, signup, check-email, substitute-signup
  (admin)/         dashboard, post-absence, pool, settings
  (substitute)/    feed, my-shifts, profile
  api/
    auth/          callback, resend
    claim-slot/    atomic claim endpoint
    notify-pool/   push + SMS fan-out
    post-absence/  insert absence + store AI rankings + call notify-pool
    rank-subs/     Claude tool_use call
    pool/          add, remove pool members
    push/          subscribe (save PushSubscription), vapid-public
    signup/        admin signup with org creation
    substitute-signup/

components/
  absence/         AiRankingPanel, SlotCard
  dashboard/       FillRateStats
  notifications/   PushPermissionBanner
  substitute/      ClaimButton
  ui/              AuthNav, PasswordInput

lib/
  supabase/        client.ts (browser), server.ts (server + admin clients)
  claude.ts        Anthropic SDK instance + CLAUDE_MODEL constant
  push.ts          web-push send helper (server only)
  sms.ts           Twilio send helper (server only)
  distance.ts      Haversine formula (org → substitute distance)
  rate-limit.ts    In-memory rate limiter
  auth-guard.ts    
  validate.ts      

hooks/
  useRealtimeFeed.ts     Supabase Realtime subscription for live slot updates
  usePushNotifications.ts SW registration + subscribe + POST to /api/push/subscribe

public/sw.js       Service worker (must be at domain root — not under /app/)
middleware.ts      Route-level auth redirect for all protected paths
supabase/migrations/
  001_schema.sql   All tables
  002_rls.sql      All RLS policies
```

---

## Data Model

**Single authoritative store: Supabase PostgreSQL.**

```
organisations          one per customer account
  └── org_admins       links auth.users to their org (admin role)
  └── pool_memberships links org to its substitute pool
  └── absences         one row per posted absence
        └── claims     one row per filled absence (UNIQUE on absence_id)
        └── notifications  audit log of every send, receive, claim attempt

substitutes            one per substitute user (auth.users + profile)
  └── pool_memberships (as above)
  └── claims
  └── notifications

ranking_logs           one row per Claude API call (latency, tokens, fallback flag)
```

**Key constraints:**

- `claims.absence_id UNIQUE` — this is the race-condition guard. Only one row can exist per absence. First insert wins; second returns PG error `23505`. The application unique-constraint check is defence-in-depth, not the primary guard.
- `pool_memberships(org_id, substitute_id) UNIQUE` — prevents duplicate pool entries.
- `substitutes.user_id UNIQUE` — one substitute profile per auth account.
- `absences.status` is an application-maintained field (`open` / `claimed` / `cancelled`). It is kept in sync after a successful claim insert but is not the authoritative source of truth for "is this slot taken" — the `claims` table is.

**Authoritative vs. derived:**

| Data | Type | Location |
|---|---|---|
| Absence requirements, status | Authoritative | `absences` table |
| Claim result | Authoritative | `claims` table |
| AI ranking output | Derived, stored | `absences.ai_rankings` JSONB (persisted after first call so admin UI doesn't re-call on refresh) |
| Distance (org → sub) | Derived, ephemeral | Computed in `/api/rank-substitutes` via Haversine before the Claude call; not stored |
| Notification delivery log | Audit | `notifications` table |
| Push subscription | Authoritative | `substitutes.push_subscription` JSONB |

---

## Core Flows

### 1. Post absence → AI rank → notify pool

```
Admin submits form (POST /api/rank-substitutes)
  │
  ├─ Auth: getUser() + verify org_admins row
  ├─ Rate limit: 1 call per admin per 10s
  ├─ Load org lat/lng + active pool memberships
  ├─ Compute distance_km for each sub (Haversine)
  │
  └─ Claude API call (tool_use, forced)
       model: claude-sonnet-4-6
       system: matching criteria (qualifications, distance, availability,
               cancellations, recency of last booking)
       tool: rank_substitutes — returns rankings[] with match_score,
             recommendation, flags[], warnings[]
       error path: catch-all → fallback=true, rankings=[]
       log: ranking_logs row (latency_ms, tokens, fallback)
       │
       └─ Return { rankings, fallback } to admin UI
            │
            └─ Admin reviews AiRankingPanel, selects scope:
                 top1 / top3 / all
                 │
                 └─ Admin submits (POST /api/post-absence)
                      │
                      ├─ Insert absences row (status='open', ai_rankings=...)
                      └─ Call POST /api/notify-pool
                           │
                           ├─ Rate limit: 1 re-notify per absence per 5min
                           ├─ Filter pool by scope (top1/top3/all)
                           └─ For each sub in filtered pool:
                                Promise.allSettled([
                                  sendPush(push_subscription, payload),  // if subscribed
                                  sendSms(phone, body)                   // if phone on file
                                ])
                                → insert notifications row per channel
                                → failure of either channel doesn't block the other
```

### 2. Substitute claim (race-condition safety)

```
Sub taps Claim (POST /api/claim-slot)
  │
  ├─ Auth: getUser()
  ├─ Verify substitute row belongs to authenticated user
  ├─ Rate limit: 1 attempt per sub per 5s
  │
  ├─ INSERT claims { absence_id, substitute_id }
  │    ├─ Success → first claimer
  │    └─ Error 23505 → "Slot just filled by someone else" (200, success:false)
  │         (second simultaneous tap hits this path)
  │
  ├─ Log claim attempt (notifications table: type='claim_attempt', result='success'|'race_lost'|'error')
  │
  └─ On success:
       UPDATE absences SET status='claimed', claimed_by=sub.id
         WHERE id=absence_id AND status='open'   ← defence-in-depth
       Supabase Realtime broadcasts the UPDATE automatically
         → All substitute feeds update instantly
         → Admin dashboard stamps FILLED without page refresh
```

**Why this is safe:** The uniqueness guarantee lives at the PostgreSQL constraint layer, not in application code. Even if two API function instances race and both pass the rate-limit and auth checks, only one `INSERT` will succeed. There is no time window between "check if claimed" and "mark as claimed" because there is no check — the insert is the check.

### 3. Real-time feed (substitute view)

```
useRealtimeFeed.ts
  │
  └─ supabase.channel('absences-feed')
       .on('postgres_changes', {
         event: '*',
         table: 'absences',
         filter: org_id=in.(orgIds)
       }, payload => {
         INSERT → prepend to feed
         UPDATE → replace in-place (covers status='claimed' and status='cancelled')
       })
       .subscribe()

RLS applies to Realtime — subscribers only receive rows their policies permit.
Cleanup: channel removed on component unmount.
```

---

## External Integrations

| Integration | Role | Critical path? | Failure mode |
|---|---|---|---|
| **Supabase Auth** | Session management, JWT, email magic links | Yes | App unusable without it |
| **Supabase Postgres** | All persistent data | Yes | App unusable without it |
| **Supabase Realtime** | Live feed updates, FILLED stamp | No | Feed requires manual refresh; claiming still works |
| **Anthropic (claude-sonnet-4-6)** | Substitute ranking and reasoning | No | Returns `{ rankings: [], fallback: true }` → UI shows unranked alphabetical list + "AI ranking unavailable" banner; posting proceeds normally |
| **Web Push (VAPID)** | Push notifications to subscribed browsers | No | `Promise.allSettled` — failure silently logged; substitute falls back to in-app Realtime feed |
| **Twilio SMS** | SMS to substitutes with a phone number | No | `Promise.allSettled` — failure silently logged; push channel still fires |

---

## Security Model

### Authentication

Supabase JWT via `@supabase/ssr`. Session is read from cookies on every server component and API route via `createServerClient`.

`middleware.ts` redirects unauthenticated requests to `/login` for all protected paths (`/dashboard`, `/post-absence`, `/pool`, `/settings`, `/feed`, `/my-shifts`, `/profile`). This is the session redirect layer; it does not perform role checks.

Every API route independently calls `supabase.auth.getUser()` and returns 401 on no session. Admin routes additionally verify an `org_admins` row exists for the authenticated user. `/api/claim-slot` verifies the `substitute_id` in the request body matches the authenticated user's substitute profile — prevents one sub from claiming on behalf of another.

### Row Level Security

RLS is enabled on all 8 tables. Policies are in `supabase/migrations/002_rls.sql`.

Key policy design decisions:
- `INSERT` and `UPDATE` on `absences` are service-role-only (no direct anon/authed insert policy). All writes go through API routes using `createAdminClient`.
- `INSERT` on `org_admins` is service-role-only. Admin accounts are created in `/api/signup` as a server-side transaction.
- Substitutes can `SELECT` from `absences` only for orgs where they have an active `pool_memberships` row. Org isolation is enforced at the data layer, not only in the UI.
- `claims.INSERT` policy checks `substitute_id IN (SELECT id FROM substitutes WHERE user_id = auth.uid())` — same check the API route makes, providing two independent enforcement layers.

Supabase Realtime inherits RLS — a substitute cannot receive real-time events for absences outside their pool.

### Rate Limiting

In-memory rate limiter (`lib/rate-limit.ts`) — resets on cold start, sufficient for current scale.

| Endpoint | Limit |
|---|---|
| `/api/claim-slot` | 1 attempt per substitute per 5s |
| `/api/rank-substitutes` | 1 call per admin per 10s |
| `/api/notify-pool` | 1 re-notify per absence per 5 minutes |

### Input Sanitisation

All text fields are trimmed and length-capped server-side before DB insert. Pay rate is `parseFloat()` with rejection on NaN or negative. Date must be today or future. Notes are capped at 500 characters. Qualifications are validated against an enum allowlist. Supabase's parameterised queries prevent SQL injection — no raw string concatenation in queries.

### Secrets

| Variable | Scope |
|---|---|
| `SUPABASE_SERVICE_ROLE_KEY` | Server only — never `NEXT_PUBLIC_` |
| `ANTHROPIC_API_KEY` | Server only |
| `VAPID_PRIVATE_KEY` | Server only |
| `TWILIO_ACCOUNT_SID` | Server only |
| `TWILIO_AUTH_TOKEN` | Server only |
| `TWILIO_PHONE_NUMBER` | Server only |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Safe — RLS gates all access |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | Safe — public by design |

---

## Binding Constraint

**The claim race condition.**

This is the hardest correctness requirement in the system. Two substitutes can tap Claim within milliseconds of each other; only one slot exists; exactly one must win.

The solution is a `UNIQUE` constraint on `claims.absence_id`. The first `INSERT` succeeds; the second returns PostgreSQL error `23505`. The API route catches `23505` and returns `{ success: false, message: 'Slot just filled by someone else' }` with a 200 status. There is no "check then insert" pattern that could race — the insert *is* the check.

The subsequent `UPDATE absences SET status='claimed'` carries a `WHERE status='open'` guard as defence-in-depth, but the `claims` table is the authoritative source of truth for slot ownership. Supabase Realtime picks up the `absences` UPDATE and fans it out to all connected substitute clients without any additional application code.

Every claim attempt (success, race loss, other error) is logged to the `notifications` table for audit.

---

## Changes from the PRD

| PRD | Implemented | Reason |
|---|---|---|
| Model `claude-sonnet-4-20250514` | `claude-sonnet-4-6` | Correct current model ID |
| Raw JSON prompt for Claude output | `tool_use` with `tool_choice: { type: 'any' }` | Structured output — no JSON parsing, schema-validated, no free-text fallback path |
| `claimed_at` set by client | `DEFAULT now()` on `claims.claimed_at` | Server-authoritative timestamp; client cannot manipulate claim time |
| SMS as v2 out-of-scope | SMS via Twilio in MVP | PRD identified "substitutes don't download the app" as high likelihood/high severity; Web Push alone won't reach subs at 6:45am reliably |
| `schema.sql` with 6 tables | 8 tables: adds `ranking_logs` | Operational visibility — logs latency, token count, fallback rate per AI call |
| `notifications` without result field | `result` column added (`success` / `race_lost` / `error`) | Needed to distinguish race losses from send failures in audit queries |
| Web Push front-loaded to Week 4 | Week 2 (Day 4) | Critical-path feature; leaving it to polish week would have de-risked the wrong thing |

---

## Build Status

### Complete (Week 2 scaffold)

- All 8 database tables created with correct constraints
- All RLS policies applied (`002_rls.sql`)
- Supabase Auth (email/password), middleware route protection
- All API routes: `post-absence`, `claim-slot`, `rank-substitutes`, `notify-pool`, `push/subscribe`, `push/vapid-public`, `pool/add`, `pool/remove`, `auth/callback`, `auth/resend`, `signup`, `substitute-signup`
- Claude `tool_use` integration with fallback and `ranking_logs`
- Atomic claim with `23505` handling and audit logging
- `useRealtimeFeed` — live feed subscription
- `usePushNotifications` — SW registration, subscribe, save to DB
- `sendPush` / `sendSms` helpers (server-only)
- In-memory rate limiter on claim, rank, and re-notify
- Haversine distance enrichment before Claude call
- `lib/validate.ts`, `lib/auth-guard.ts`
- All page components scaffolded: auth, admin (dashboard, post-absence, pool, settings), substitute (feed, my-shifts, profile)
- `AiRankingPanel`, `SlotCard`, `ClaimButton`, `FillRateStats`, `PushPermissionBanner`
- Service worker (`public/sw.js`) with push handler and notification-click deep-link
- Playwright test scaffold

### Planned (Weeks 3–4)

- Week 3: RLS policy audit and tightening under test, claim-auth verification tests, rate-limit tests, input-sanitisation audit, `npm audit`, env variable sweep
- Week 4: Edge cases (admin cancels slot mid-claim, Claude timeout graceful degradation, Safari iOS < 16.4 fallback), mobile polish (safe area insets, 44×44px touch targets, push deep-link on physical device), real-device race-condition test (two physical devices, not dev tabs), fill-rate monitoring, beta onboarding (2 real schools)

---

## Non-Goals (v2 and beyond)

- Stripe billing — schema and pricing designed in; not activated
- Calendar integrations (Google Calendar, Outlook)
- Substitute ratings and reviews
- Lesson plan / file attachments on absences
- Native mobile app — PWA only
- Multi-location organisations
- Automated payroll / timesheet integration
- SMS as primary notification channel (Twilio is additive, not primary)

---

## Cost Model

| Operation | Approx. tokens | Approx. cost |
|---|---|---|
| Claude ranking per absence (pool of ~15) | ~700 input / ~350 output | ~$0.005 |
| 30 absences/month/org | — | ~$0.15/org/month |

At $49/month per organisation, AI cost is ~0.3% of revenue. Supabase and Vercel free tiers cover expected beta and early-growth volume.

Ranking latency is logged to `ranking_logs`. Target p50 < 3s for a pool of 20 substitutes.
