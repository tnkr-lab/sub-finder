# SubFill — Implementation Plan (Weeks 2–4)

## Context

Week 1 (PRD + architecture) is complete. This plan covers the full build, security, and polish phases. The goal is a working end-to-end demo by end of Week 4: admin posts → Claude ranks → push fires → substitute claims → dashboard stamps FILLED in under 3 minutes.

**PRD corrections applied:**
- Model ID: `claude-sonnet-4-6` (not `claude-sonnet-4-20250514` as written in PRD)
- Claude call: Anthropic SDK with `tool_use` structured output (not raw JSON prompt)
- `claimed_at`: dropped from claim insert — use DB `DEFAULT now()` (server-authoritative)
- Web Push (service worker + VAPID): front-loaded to Day 4, not left to Week 4
- **SMS via Twilio added to MVP** — PRD flagged "substitutes don't download the app" as high likelihood/high severity; Web Push alone won't reach subs at 6:45am

---

## Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14 (App Router) + Tailwind CSS |
| Backend | Next.js API routes (serverless, Vercel) |
| Database | Supabase (PostgreSQL + Auth + Realtime) |
| AI | Anthropic SDK — `claude-sonnet-4-6` |
| Notifications | Supabase Realtime + Web Push API + Twilio SMS |
| Hosting | Vercel (free tier) |

---

## Project Structure

```
subfill/
├── app/
│   ├── layout.tsx
│   ├── page.tsx                          # Landing / redirect to /login
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   └── signup/page.tsx
│   ├── (admin)/
│   │   ├── layout.tsx                    # Auth guard + sidebar
│   │   ├── dashboard/page.tsx            # Active postings + fill rate stats
│   │   ├── post-absence/page.tsx         # Absence form + AI ranking results
│   │   ├── pool/page.tsx                 # Substitute pool management
│   │   └── settings/page.tsx
│   └── (substitute)/
│       ├── layout.tsx                    # Auth guard + nav
│       ├── feed/page.tsx                 # Live slot feed (real-time)
│       ├── my-shifts/page.tsx            # Confirmed shifts + earnings
│       └── profile/page.tsx
├── app/api/
│   ├── auth/callback/route.ts
│   ├── rank-substitutes/route.ts         # Claude tool_use call
│   ├── post-absence/route.ts             # Insert absence + trigger notify
│   ├── claim-slot/route.ts               # Atomic claim (race-condition safe)
│   ├── notify-pool/route.ts              # Web Push + SMS to substitute pool
│   └── push/
│       ├── subscribe/route.ts            # Save push subscription to DB
│       └── vapid-public/route.ts         # Return public VAPID key
├── components/
│   ├── ui/                               # Button, Card, Badge, Modal, Spinner
│   ├── absence/
│   │   ├── AbsenceForm.tsx
│   │   ├── AiRankingPanel.tsx            # Ranked subs: score, flags, warnings
│   │   └── SlotCard.tsx                  # Used in feed + dashboard
│   ├── substitute/
│   │   └── ClaimButton.tsx               # Optimistic state + race guard
│   ├── dashboard/
│   │   ├── PostingList.tsx
│   │   └── FillRateStats.tsx
│   └── notifications/
│       └── PushPermissionBanner.tsx
├── lib/
│   ├── supabase/
│   │   ├── client.ts                     # Browser singleton
│   │   ├── server.ts                     # Server client (cookies)
│   │   └── types.ts                      # Generated via supabase gen types
│   ├── claude.ts                         # Anthropic SDK + CLAUDE_MODEL constant
│   ├── push.ts                           # web-push send helper (server only)
│   ├── sms.ts                            # Twilio send helper (server only)
│   ├── distance.ts                       # Haversine formula
│   └── auth-guard.ts
├── hooks/
│   ├── useRealtimeFeed.ts
│   ├── useAbsenceStatus.ts
│   └── usePushNotifications.ts
├── middleware.ts                          # Protect /(admin) and /(substitute)
├── public/
│   ├── sw.js                             # Service worker (must be at domain root)
│   └── icons/
├── supabase/
│   └── migrations/
│       ├── 001_schema.sql
│       └── 002_rls.sql
└── .env.local
```

---

## Database Schema

```sql
-- 001_schema.sql

CREATE TABLE organisations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  type text,                    -- 'school' | 'care_home' | 'workplace'
  location text,
  lat decimal, lng decimal,
  default_pay_rate decimal,
  created_at timestamp DEFAULT now()
);

CREATE TABLE org_admins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid REFERENCES organisations NOT NULL,
  user_id uuid REFERENCES auth.users NOT NULL,
  role text DEFAULT 'admin'
);

CREATE TABLE substitutes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users UNIQUE NOT NULL,
  name text NOT NULL,
  email text NOT NULL,
  phone text,
  qualifications text[],
  certifications text[],
  lat decimal, lng decimal,
  max_distance_km int DEFAULT 20,
  availability jsonb,            -- {"mon":true,"tue":true,...,"sun":false}
  cancellation_count int DEFAULT 0,
  total_shifts int DEFAULT 0,
  last_booked_at timestamp,
  push_subscription jsonb,       -- Web Push PushSubscription JSON
  created_at timestamp DEFAULT now()
);

CREATE TABLE pool_memberships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid REFERENCES organisations NOT NULL,
  substitute_id uuid REFERENCES substitutes NOT NULL,
  active bool DEFAULT true,
  added_at timestamp DEFAULT now(),
  UNIQUE(org_id, substitute_id)
);

CREATE TABLE absences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid REFERENCES organisations NOT NULL,
  posted_by uuid REFERENCES org_admins NOT NULL,
  absent_staff_name text NOT NULL,
  date date NOT NULL,
  start_time time NOT NULL,
  end_time time NOT NULL,
  role text,
  pay_rate decimal NOT NULL,
  notes text,
  status text DEFAULT 'open',   -- 'open' | 'claimed' | 'cancelled'
  claimed_by uuid REFERENCES substitutes,
  claimed_at timestamp,
  ai_rankings jsonb,
  viewers_count int DEFAULT 0,
  created_at timestamp DEFAULT now()
);

CREATE TABLE claims (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  absence_id uuid REFERENCES absences UNIQUE NOT NULL,  -- ONE claim per absence
  substitute_id uuid REFERENCES substitutes NOT NULL,
  claimed_at timestamp DEFAULT now()                    -- server-set, not client
);

CREATE TABLE notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  substitute_id uuid REFERENCES substitutes NOT NULL,
  absence_id uuid REFERENCES absences NOT NULL,
  type text NOT NULL,           -- 'new_slot' | 'slot_filled' | 'claim_confirmed'
  sent_at timestamp DEFAULT now(),
  read_at timestamp
);
```

---

## Environment Variables

```bash
# .env.local — never committed
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=        # server only — never NEXT_PUBLIC_
ANTHROPIC_API_KEY=                # server only
VAPID_PRIVATE_KEY=                # server only — generate: npx web-push generate-vapid-keys
VAPID_SUBJECT=mailto:you@example.com
NEXT_PUBLIC_VAPID_PUBLIC_KEY=     # safe to expose (public by design)
TWILIO_ACCOUNT_SID=               # server only
TWILIO_AUTH_TOKEN=                # server only
TWILIO_PHONE_NUMBER=              # e.g. +61400000000
```

---

## Week 2 — Build (Day by Day)

### Day 1: Scaffold + Database

- `create-next-app@14` with TypeScript, Tailwind, App Router
- Supabase project created, anon key + service role key captured
- Apply `001_schema.sql` migration
- Apply `002_rls.sql` with placeholder permissive policies (locked down Week 3)
- `.env.local` populated with all keys
- `lib/supabase/client.ts` and `lib/supabase/server.ts`
- Generate VAPID key pair now — do not defer

**Gate:** `npm run dev` loads. Supabase dashboard shows all 7 tables.

---

### Day 2: Auth + Org Setup

- `app/(auth)/login/page.tsx` — `supabase.auth.signInWithPassword`
- `app/(auth)/signup/page.tsx` — creates `auth.users` row + `organisations` + `org_admins` in single server-side call using service role client
- `middleware.ts` — protect `/(admin)` and `/(substitute)` route groups, redirect to `/login`
- `api/auth/callback/route.ts`
- `app/(admin)/pool/page.tsx` stub — empty table with "Invite substitute" button

**Gate:** Admin signs up → org row in DB → middleware redirects unauthed requests.

---

### Day 3: Claude AI Matching

- `lib/claude.ts` — Anthropic SDK instance, `CLAUDE_MODEL = 'claude-sonnet-4-6'`
- `lib/distance.ts` — Haversine function (used to enrich pool data before Claude call)
- `api/rank-substitutes/route.ts` — full tool_use implementation (see Key Patterns below)
- `app/(admin)/post-absence/page.tsx` — full form: absent staff, date, start/end time, role, pay rate, notes
- `components/absence/AiRankingPanel.tsx` — ranked sub cards with score badge, flags, warnings

**Gate:** POST to `/api/rank-substitutes` with seeded data returns `{ rankings: [...] }` with `match_score`, `recommendation`, `flags`, `warnings`.

---

### Day 4: Notifications — Web Push + SMS

**Web Push:**
- `public/sw.js` — `push` event shows notification; `notificationclick` deep-links to `/feed?absence=<id>`
- `api/push/vapid-public/route.ts` — returns public VAPID key
- `api/push/subscribe/route.ts` — saves `PushSubscription` JSON to `substitutes.push_subscription`
- `hooks/usePushNotifications.ts` — registers SW, subscribes, POSTs subscription to API
- `lib/push.ts` — `web-push` library wrapper (server only)
- `components/notifications/PushPermissionBanner.tsx` — shown on substitute first login

**SMS (Twilio):**
- `npm install twilio`
- `lib/sms.ts` — Twilio client wrapper:
  ```typescript
  import twilio from 'twilio'
  const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)

  export async function sendSms(to: string, body: string) {
    return client.messages.create({
      from: process.env.TWILIO_PHONE_NUMBER,
      to,
      body
    })
  }
  ```
- `api/notify-pool/route.ts` sends both Web Push AND SMS per substitute:
  - Web Push fires to any substitute with a saved `push_subscription`
  - SMS fires to any substitute with a `phone` number on their profile
  - Both channels run in parallel (`Promise.allSettled` — failure of one doesn't block the other)
- SMS message format: `"New shift at Riverside Primary — TODAY 8:30am–3:30pm · $285. Claim now: https://subfill.app/feed"`

**Gate:** Admin posts absence → substitute receives both a browser push notification AND an SMS within 3 seconds.

---

### Day 5: Post Absence + Notify Pool

- `api/post-absence/route.ts` — inserts absence, stores `ai_rankings` JSONB, calls `notify-pool`
- `api/notify-pool/route.ts` — queries `pool_memberships`, sends Web Push (if subscribed) + SMS (if phone on file) per sub via `Promise.allSettled`
- Admin notification scope choice wired up: notify top 1 / top 3 / all
- Post absence page submits form → shows AI ranking → admin confirms scope → posts

**Gate:** Admin posts absence. Absence in DB with `status = 'open'`. Push notification appears on substitute's device within 2 seconds.

---

### Day 6: Real-Time Claiming

- `hooks/useRealtimeFeed.ts` — `supabase.channel().on('postgres_changes', ...)` subscription
- `app/(substitute)/feed/page.tsx` — live slot feed with real-time updates
- `components/absence/SlotCard.tsx` — countdown timer, distance, status badge (OPEN/FILLED)
- `components/substitute/ClaimButton.tsx` — optimistic "Claiming…" → "Claimed" state
- `api/claim-slot/route.ts` — atomic insert, catch `23505`, update absence status (see Key Patterns)

**Gate:** Two tabs, two substitute accounts, both tap Claim simultaneously. One succeeds; the other sees "Slot just filled by someone else." Admin tab stamps FILLED without page refresh.

---

### Day 7: Admin Dashboard + My Shifts

- `app/(admin)/dashboard/page.tsx` — active postings table (date, time, role, status, claimer, fill time)
- `components/dashboard/FillRateStats.tsx` — % filled, average fill time
- Re-notify button — calls `/api/notify-pool` with `absence_id`
- `app/(substitute)/my-shifts/page.tsx` — upcoming confirmed shifts + past history + monthly earnings
- `app/(substitute)/profile/page.tsx` — edit availability, qualifications, max distance

**Gate:** Full demo sequence runs end-to-end. Post → rank (2s) → push (instant) → claim (90s) → FILLED (instant).

---

## Key Implementation Patterns

### Claude API — tool_use (structured output)

```typescript
// lib/claude.ts
import Anthropic from '@anthropic-ai/sdk'
export const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
export const CLAUDE_MODEL = 'claude-sonnet-4-6'

// api/rank-substitutes/route.ts
const rankingTool: Anthropic.Tool = {
  name: 'rank_substitutes',
  description: 'Rank substitute teachers for an absence by match quality',
  input_schema: {
    type: 'object',
    properties: {
      rankings: {
        type: 'array',
        items: {
          type: 'object',
          required: ['substitute_id', 'match_score', 'recommendation', 'flags', 'warnings'],
          properties: {
            substitute_id: { type: 'string' },
            match_score:   { type: 'number', minimum: 0, maximum: 100 },
            recommendation: { type: 'string' },
            flags:    { type: 'array', items: { type: 'string' } },
            warnings: { type: 'array', items: { type: 'string' } }
          }
        }
      }
    },
    required: ['rankings']
  }
}

const response = await anthropic.messages.create({
  model: CLAUDE_MODEL,
  max_tokens: 1024,
  system: `You are a substitute matching engine for SubFill.
Rank substitutes by suitability. Consider: qualifications match, distance (closer = better),
day-of-week availability, cancellation history (lower = better), recency of last booking
(avoid over-relying on same person). Be specific in recommendations. Call rank_substitutes.`,
  messages: [{ role: 'user', content:
    `ABSENCE:\n${JSON.stringify(absence)}\n\nSUBSTITUTE POOL:\n${JSON.stringify(poolWithDistances)}`
  }],
  tools: [rankingTool],
  tool_choice: { type: 'any' }   // forces tool call — no free-text fallback
})

const block = response.content.find(b => b.type === 'tool_use')
if (!block || block.type !== 'tool_use') throw new Error('Claude did not call ranking tool')
const { rankings } = block.input as { rankings: RankedSubstitute[] }
// block.input is already a parsed JS object — no JSON.parse() needed
```

Error handling: wrap in try/catch; on any error return `{ rankings: [], fallback: true }` — UI shows unranked alphabetical list with "AI ranking unavailable" banner. Do not block absence posting on Claude failure.

---

### Real-Time Feed — Supabase Realtime

```typescript
// hooks/useRealtimeFeed.ts
const channel = supabase
  .channel('absences-feed')
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'absences',
    filter: `org_id=in.(${orgIds.join(',')})`
  }, (payload) => {
    if (payload.eventType === 'INSERT')
      setAbsences(prev => [payload.new as Absence, ...prev])
    if (payload.eventType === 'UPDATE')
      setAbsences(prev => prev.map(a => a.id === payload.new.id ? payload.new as Absence : a))
  })
  .subscribe()

return () => { supabase.removeChannel(channel) }  // always clean up on unmount
```

**Important:** Enable Realtime on the `absences` table in Supabase dashboard → Table Editor. RLS applies to Realtime — subscribers only receive rows they're allowed to see.

---

### Atomic Claim — Race Condition Prevention

```typescript
// api/claim-slot/route.ts
const { error: claimError } = await supabase
  .from('claims')
  .insert({ absence_id: absenceId, substitute_id: sub.id })
  // No claimed_at — DB DEFAULT now() is used (server-authoritative)

if (claimError?.code === '23505') {
  return Response.json({ success: false, message: 'Slot just filled by someone else' })
}
if (claimError) {
  return Response.json({ error: 'Claim failed' }, { status: 500 })
}

// Claim won — update absence using service role client
await supabaseAdmin
  .from('absences')
  .update({ status: 'claimed', claimed_by: sub.id })
  .eq('id', absenceId)
  .eq('status', 'open')   // defence-in-depth; UNIQUE constraint is the real guard

// Supabase Realtime broadcasts the UPDATE automatically
```

---

### Service Worker

```javascript
// public/sw.js  (must be at domain root, not under /app/)
self.addEventListener('push', (event) => {
  const data = event.data?.json() ?? {}
  event.waitUntil(
    self.registration.showNotification(data.title ?? 'SubFill', {
      body: data.body,
      icon: '/icons/icon-192.png',
      data: { url: data.url ?? '/feed' },
      requireInteraction: true
    })
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url = event.notification.data?.url ?? '/feed'
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then(list => {
      const existing = list.find(c => c.url.includes(url))
      return existing ? existing.focus() : clients.openWindow(url)
    })
  )
})
```

Push payload: `{ title: "New shift — Riverside Primary", body: "TODAY · 8:30am–3:30pm · $285", url: "/feed?absence=<id>" }`

---

## Week 3 — Security

### RLS Policies (002_rls.sql)

Enable RLS on all tables: `ALTER TABLE x ENABLE ROW LEVEL SECURITY;`

| Table | Policy | Rule |
|---|---|---|
| `organisations` | SELECT, UPDATE | `id IN (SELECT org_id FROM org_admins WHERE user_id = auth.uid())` |
| `org_admins` | SELECT | `user_id = auth.uid()` |
| `org_admins` | INSERT | service role only (via API route) |
| `substitutes` | SELECT (own) | `user_id = auth.uid()` |
| `substitutes` | SELECT (admin) | `id IN (SELECT substitute_id FROM pool_memberships WHERE org_id IN (SELECT org_id FROM org_admins WHERE user_id = auth.uid()))` |
| `substitutes` | UPDATE | `user_id = auth.uid()` |
| `pool_memberships` | SELECT | admin sees their pool; sub sees their memberships |
| `absences` | SELECT (admin) | `org_id IN (SELECT org_id FROM org_admins WHERE user_id = auth.uid())` |
| `absences` | SELECT (sub) | `org_id IN (SELECT org_id FROM pool_memberships WHERE substitute_id IN (SELECT id FROM substitutes WHERE user_id = auth.uid()) AND active = true)` |
| `absences` | INSERT, UPDATE | service role via API routes only |
| `claims` | INSERT | `substitute_id IN (SELECT id FROM substitutes WHERE user_id = auth.uid())` |
| `claims` | SELECT | own substitute OR admin of the org |
| `notifications` | SELECT | own substitute OR admin of the org |

### API Auth Middleware

Every protected route:
```typescript
const { data: { user } } = await supabase.auth.getUser()
if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })
```

Admin routes additionally verify `org_admins` row exists for `user.id`.

`/api/claim-slot` verifies authenticated user owns the `substitute_id` being passed.

### Rate Limiting

- `/api/claim-slot` — 1 attempt per substitute per 5 seconds
- `/api/rank-substitutes` — 1 call per admin per 10 seconds
- `/api/notify-pool` — 1 re-notify per absence per 5 minutes (prevents SMS spam to substitute pool)

### Input Sanitisation

- All text: `input.trim().slice(0, maxLength)` before DB insert
- Date: must be today or future (server-side)
- Pay rate: `parseFloat()`, reject if NaN or negative
- Notes: max 500 chars
- Qualifications array: validated against allowlist enum

### OWASP Checklist

- [ ] A01 Broken Access Control — RLS + API auth guard on every route
- [ ] A02 Cryptographic Failures — all secrets in env vars; no `NEXT_PUBLIC_` prefix on secret keys
- [ ] A03 Injection — Supabase parameterized queries only; no raw SQL string concatenation
- [ ] A04 Insecure Design — UNIQUE constraint on `claims.absence_id` (not application logic) is the security mechanism
- [ ] A05 Security Misconfiguration — verify anon role cannot bypass RLS; service role key server-only
- [ ] A06 Vulnerable Components — `npm audit` before Week 4; pin key dependencies
- [ ] A07 Auth Failures — Supabase JWT; middleware validates on every protected route
- [ ] A09 Logging — log claim attempts (success + 23505 failures) to `notifications` table for audit

### Env Audit

| Var | Scope | Rule |
|---|---|---|
| `SUPABASE_SERVICE_ROLE_KEY` | Server only | Never `NEXT_PUBLIC_` |
| `ANTHROPIC_API_KEY` | Server only | Never `NEXT_PUBLIC_` |
| `VAPID_PRIVATE_KEY` | Server only | Never `NEXT_PUBLIC_` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Safe | RLS gates all access |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | Safe | Public by design |
| `TWILIO_ACCOUNT_SID` | Server only | Never `NEXT_PUBLIC_` |
| `TWILIO_AUTH_TOKEN` | Server only | Never `NEXT_PUBLIC_` |
| `TWILIO_PHONE_NUMBER` | Server only | Never `NEXT_PUBLIC_` |

---

## Week 4 — Polish

### Performance Testing

- [ ] 10 substitute accounts on feed simultaneously — verify no Realtime connection drops
- [ ] Race condition: two tabs claim same slot within 200ms — one succeeds, one sees "Slot just filled"
- [ ] Claude p50 latency for pool of 20 subs — target under 3 seconds
- [ ] Supabase Realtime latency (DB write → UI update) — target under 500ms
- [ ] Lighthouse on feed + dashboard — target 85+ mobile

### Edge Cases

- [ ] Admin cancels absence while substitute is in claim flow — `cancelled` status broadcast via Realtime, claim attempt returns graceful error
- [ ] Claude API timeout — show unranked list with "AI ranking unavailable" banner; posting proceeds normally
- [ ] Substitute has no push subscription — `notify-pool` catches send failure silently, logs as undeliverable
- [ ] No substitutes in pool — AI ranking returns empty array with message, admin sees clear feedback
- [ ] Push permission denied — hide banner after denial, app falls back to in-app Realtime feed only
- [ ] Safari iOS below 16.4 — show "notifications not supported" warning; PWA still works

### Mobile Polish

- [ ] Safe area insets on Claim button (iOS home indicator)
- [ ] Slot cards readable at 375px width
- [ ] Push notification tap deep-links to correct slot (`/feed?absence=<id>`)
- [ ] Touch targets minimum 44×44px
- [ ] Test on physical iOS device (not DevTools emulation) for push

### Beta

- [ ] Onboard 2 real schools — each with 1 admin, minimum 5 substitutes
- [ ] Full walkthrough: admin signup → invite subs → post absence → substitute receives push → claims → FILLED
- [ ] Verify RLS isolation: Org A admin cannot see Org B data (log in as each, query absences)
- [ ] Collect feedback on UX friction; fix critical issues before demo

### Monitoring

- [ ] Log every AI ranking call: `org_id`, `absence_id`, latency, token usage
- [ ] Log every claim attempt: `substitute_id`, `absence_id`, result (success / 23505 / other)
- [ ] Fill rate per org per week: count open vs claimed
- [ ] Average fill time: `claims.claimed_at - absences.created_at`

---

## Verification — Week by Week

### Week 2 Gates

| Day | Test |
|---|---|
| 2 | Admin signup → org row in DB → middleware redirects unauthed to /login |
| 3 | POST /api/rank-substitutes with seeded data → `rankings` array with score, flags, warnings |
| 4 | Substitute accepts push permission → subscription in DB → test push delivers to physical device |
| 5 | Admin posts absence → absence in DB status `open` → push fires within 2s |
| 6 | Two tabs claim simultaneously → one success, one "Slot just filled"; admin sees FILLED live |
| 7 | Full demo sequence: post → rank (2s) → push (instant) → claim (90s) → FILLED (instant) |

### Week 3 Gates

| Test | Pass Criteria |
|---|---|
| RLS isolation | Log in as Org A admin — zero Org B absences returned |
| Claim auth | No session → 401; wrong substitute_id → 403 |
| Rate limit | 5 rapid POSTs to /api/rank-substitutes → 429 on 3rd+ |
| Input sanity | `<script>` in form field → stored as escaped string, not executed |

### Week 4 Gates

| Test | Pass Criteria |
|---|---|
| Race condition | Confirmed with 2 real devices, not just dev tabs |
| Claude fallback | Invalid API key → unranked list shown, absence still saves |
| Push deep link | Notification tap navigates to correct slot on physical device |
| Demo rehearsal | Full sequence run 3× — post to FILLED under 3 minutes each time |

---

## Out of Scope (v2)

- Stripe billing (schema designed in, not activated)
- ~~SMS notifications~~ — **moved to MVP (Twilio)**
- Calendar integrations (Google Calendar, Outlook)
- Substitute ratings and reviews
- Lesson plan / file attachments
- Native mobile app (PWA only)
- Multi-location organisations
- Automated payroll / timesheet integration
