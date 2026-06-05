# SubFill — Product Requirements Document

### Version 1.0 · Course Submission · Week 1 Deliverable

---

## Executive Summary

SubFill is a B2B2C web app that eliminates the morning chaos of finding substitute cover. An administrator posts an open slot in 30 seconds. The app notifies a pre-approved substitute pool instantly. The first available substitute claims the slot. Everyone is notified. Done.

The generic version of this problem is solved badly everywhere: group texts, phone trees, WhatsApp chaos, and expensive enterprise platforms that small organisations cannot afford or implement.

The differentiated version is what we're building: **an AI-powered substitute matching and real-time claiming platform built specifically for small-to-mid organisations — schools, care homes, community centres, and small businesses — that currently solve this problem with their phones.**

**One-line positioning:** *"Fill any absence in under 30 minutes. No phone calls. No group texts. No chaos."*

---

## Problem Statement

Every morning, across thousands of schools and workplaces, the same crisis plays out:

A staff member calls in sick at 6:45am. An administrator starts making phone calls. First person can't make it. Second doesn't answer. Third is already booked. The group text goes out. Nobody replies for 20 minutes. The bell rings at 8:30am and the class has no teacher.

This is not a technology problem. It is a **coordination and urgency problem** — and it happens every single day, in every organisation that relies on flexible cover staff.

The solutions that exist are either:

- **Too expensive and complex** (Frontline Education, SmartFind Express) — built for large districts with dedicated HR teams and six-figure implementation budgets  
- **Too generic** (Deputy, Homebase, Connecteam) — shift-cover is a buried feature inside a full workforce management platform, not designed for the specific urgency of morning absence cover  
- **Not digital at all** — the majority of small-to-mid organisations still use phone calls and group texts

The gap is real, validated, and worth building for.

---

## Target Organisation

**Primary: Independent and small-network schools**

- 50–500 students  
- 10–40 teaching staff  
- Substitute pool of 8–20 casual teachers  
- Currently using phone calls, email, or WhatsApp to find cover  
- Cannot afford or justify enterprise platforms like Frontline

**Secondary: Small shift-based workplaces**

- Care homes, community centres, small retail or hospitality businesses  
- 10–50 staff members  
- Regular need for last-minute cover  
- Currently managed by a manager's personal phone

**Beachhead (first 90 days):** Independent primary and secondary schools. One decision-maker (the principal or office manager), acute daily pain, and a clear willingness to pay for anything that saves them an hour every morning.

---

## Target Users — Two Sides

**The Administrator (posts the need)**

- School office manager, principal, or shift manager  
- Experiences the pain directly — personally makes the phone calls  
- Wants: post once, get confirmation fast, minimal back-and-forth  
- Success metric: slot filled in under 30 minutes without phone calls

**The Substitute (claims the slot)**

- Casual teacher, relief worker, or on-call staff member  
- Wants: see available work near them, claim fast before it's gone, track earnings  
- Success metric: found and claimed a shift in under 2 minutes

---

## Jobs To Be Done

**Administrator:**

1. "Post an absence quickly so I can get back to running the school"  
2. "Know the slot is filled without having to chase anyone"  
3. "Find the most qualified available substitute automatically"

**Substitute:**

1. "See work that's available for me right now"  
2. "Claim it before someone else does"  
3. "Track what I've earned and when I'm working"

---

## The AI Differentiator — Smart Matching

This is the Claude Code showcase feature. SubFill doesn't just blast a notification to everyone in the pool — it **ranks and recommends** the best matches first.

When an absence is posted, Claude analyses the substitute pool and returns a ranked recommendation:

"Based on this organisation's history and pool:

1\. Sarah Chen — Best match (94% score)

   ✓ Certified Year 5 English

   ✓ 0 cancellations in last 30 days

   ✓ 2.1km from school

   ✓ Available Thursdays (set in profile)

   ✓ Last called 8 days ago (not over-relied on)

2\. Marcus Reid — Strong match (81% score)

   ✓ Certified primary teacher

   ⚠ 1 cancellation last month

   ✓ 3.4km from school

   ✓ Available today

3\. David Kim — Good match (74% score)

   ✓ Certified but Year 5 not primary specialty

   ✓ 0 cancellations

   ⚠ 6.8km from school"

The administrator sees this ranking before posting — they can send to top matches first, or blast the whole pool. This is the feature that makes SubFill smarter than a group text, and it's the AI architecture showcase the course requires.

---

## Competitive Landscape

| Competitor | Target | AI Matching | Real-time claiming | Small org pricing | Mobile-first |
| :---- | :---- | :---- | :---- | :---- | :---- |
| Frontline Education | Large districts | ⚠️ Basic | ✅ | ❌ Enterprise only | ⚠️ |
| Schrole Cover | Schools (AU) | ❌ | ✅ | ⚠️ Mid-market | ✅ |
| Deputy / Homebase | Restaurants/retail | ❌ | ✅ Feature only | ✅ | ✅ |
| SmartFind Express | Large districts | ❌ | ✅ | ❌ Enterprise only | ⚠️ |
| Group text / phone | All | ❌ | ❌ | Free | ✅ |
| **SubFill** | **Small-mid orgs** | **✅ Claude AI** | **✅ Core mechanic** | **✅ $49/mo** | **✅** |

**Key insight:** Every competitor either targets enterprise (wrong price point) or treats substitute matching as a generic scheduling feature (wrong product). SubFill is purpose-built for the small-org morning-absence crisis, with AI matching nobody else offers at this price point.

---

## MVP Scope — Week 2 Build

### In Scope (must ship)

**1\. Organisation onboarding**

- Admin signs up, creates organisation profile (name, type, location, pay rates)  
- Uploads substitute pool (name, email, phone, qualifications, certifications)  
- Substitutes receive invite email and set up their profile (availability, distance willing to travel, qualifications)

**2\. Post an absence (admin flow)**

- Select absent staff member from roster  
- Set date, time, role/subject, pay rate  
- AI matching runs — Claude ranks top 3 substitutes with reasoning  
- Admin chooses: notify top matches only, or blast entire pool  
- Absence posted — notification sent instantly

**3\. Real-time claiming (substitute flow)**

- Substitute receives push notification / in-app alert  
- Sees slot details: organisation, date, time, role, pay rate, distance  
- Taps Claim → confirmation modal → confirmed  
- All other substitutes notified: slot is filled  
- Admin notified instantly: who claimed, when

**4\. Live slot feed**

- Substitute sees all open slots in their pool(s)  
- Urgency signals: countdown timer, number of subs viewing, "TODAY" badges  
- Claimed slots visually stamped as filled  
- Filter by date, distance, role type

**5\. Admin dashboard**

- All active postings with status (open / claimed / cancelled)  
- Fill rate stats (what % of slots filled, average fill time)  
- Substitute pool management (add, remove, update qualifications)  
- Re-notify pool with one tap if slot unfilled after X minutes

**6\. My Shifts (substitute)**

- Upcoming confirmed shifts  
- Past shift history  
- Monthly earnings tracker

**7\. AI matching engine**

- Claude analyses substitute pool against slot requirements  
- Returns ranked list with match score and reasoning  
- Factors: qualifications match, cancellation history, distance, availability, recency of last booking  
- Displayed to admin before posting

**8\. Auth \+ org isolation**

- Email/password via Supabase Auth  
- Row Level Security: organisations only see their own data  
- Substitutes only see slots from organisations they're pooled with

### Out of Scope — v2

- Automated payroll / timesheet integration  
- SMS notifications (web push only for course)  
- Multi-location organisations  
- Substitute ratings and reviews  
- Lesson plan / notes attachment  
- Native mobile app (PWA for course)  
- Stripe billing (designed in, not activated)  
- Calendar integrations (Google Calendar, Outlook)

---

## User Journey — Primary Flow

### Administrator Flow

STAFF CALLS IN SICK (6:45am)

        ↓

Admin opens SubFill → taps "Post Absence"

        ↓

Selects: Staff member \+ Date \+ Time \+ Role \+ Pay rate

(\~30 seconds)

        ↓

AI matching runs (Claude, \~2 seconds)

→ "Top 3 recommended substitutes" with scores \+ reasoning

        ↓

Admin chooses notification scope:

→ "Notify top match only" OR "Notify all 12 in pool"

        ↓

Slot goes live → push notifications fire

        ↓

Admin dashboard shows: "3 subs viewing · 0 claimed"

        ↓

\[7 minutes later\]

"✓ Sarah Chen claimed · 7:04am"

→ Admin gets push notification

→ All other subs notified: slot filled

        ↓

Admin goes back to running the school.

TOTAL TIME: 8 minutes. Zero phone calls.

### Substitute Flow

PUSH NOTIFICATION: "New shift — Riverside Primary · TODAY · $285"

        ↓

Opens SubFill → sees slot card

(org, date, time, role, pay, distance, countdown timer)

        ↓

Taps "Claim →"

        ↓

Confirmation modal → "Confirm"

        ↓

✅ SHIFT CLAIMED

→ Confirmation card saved to My Shifts

→ Admin notified

→ Other subs notified: slot filled

        ↓

Sub arrives at school 8:30am.

TOTAL TIME TO CLAIM: 90 seconds.

**The demo moment that sells the idea:** Admin posts an absence, Claude returns ranked matches with reasoning ("Sarah Chen — 94% match, certified Year 5, 0 cancellations, 2.1km away"), admin notifies top match, slot is claimed in under 2 minutes, admin dashboard stamps "FILLED." That sequence — from posting to filled — is the entire pitch demonstrated live.

---

## Technical Architecture

### Stack

- **Frontend:** Next.js 14 (App Router) \+ Tailwind CSS  
- **Backend:** Next.js API routes (serverless)  
- **Database:** Supabase (PostgreSQL \+ Auth \+ Realtime)  
- **Real-time:** Supabase Realtime subscriptions (live slot updates, claim notifications)  
- **AI — Matching:** Claude claude-sonnet-4-20250514 (substitute ranking and reasoning)  
- **Notifications:** Supabase Realtime \+ Web Push API  
- **Hosting:** Vercel (free tier for course)

### Data Flow

\[Admin posts absence\]

        ↓

\[Next.js API: /api/post-absence\]

        ↓

\[Claude API: rank substitute pool\]

→ Input: slot requirements \+ full substitute pool profiles

→ Output: ranked list with scores and reasoning (JSON)

        ↓

\[Supabase: insert absence record \+ store AI rankings\]

        ↓

\[Supabase Realtime: broadcast to substitute clients\]

→ All substitutes in pool receive live update

→ Push notification fires

        ↓

\[Substitute taps Claim\]

        ↓

\[Next.js API: /api/claim-slot\]

→ Atomic transaction: mark slot claimed \+ record claimer

→ Prevent race condition (first claim wins)

        ↓

\[Supabase Realtime: broadcast slot-filled event\]

→ Admin receives "filled" notification

→ All other substitutes see slot stamped FILLED

→ Remaining subs' notifications dismissed

### Database Schema

\-- Organisations

organisations (

  id uuid PRIMARY KEY,

  name text NOT NULL,

  type text,              \-- 'school' | 'care\_home' | 'workplace'

  location text,

  lat decimal,

  lng decimal,

  default\_pay\_rate decimal,

  created\_at timestamp

)

\-- Organisation members (admins)

org\_admins (

  id uuid PRIMARY KEY,

  org\_id uuid REFERENCES organisations,

  user\_id uuid REFERENCES auth.users,

  role text DEFAULT 'admin'

)

\-- Substitute pool

substitutes (

  id uuid PRIMARY KEY,

  user\_id uuid REFERENCES auth.users,

  name text NOT NULL,

  email text,

  phone text,

  qualifications text\[\],    \-- \['year\_1\_6','maths','english','year\_7\_12'\]

  certifications text\[\],    \-- \['wwcc','first\_aid'\]

  lat decimal,

  lng decimal,

  max\_distance\_km int DEFAULT 20,

  availability jsonb,        \-- {mon:true, tue:true, ...}

  cancellation\_count int DEFAULT 0,

  total\_shifts int DEFAULT 0,

  created\_at timestamp

)

\-- Org \<\> Substitute pool membership

pool\_memberships (

  id uuid PRIMARY KEY,

  org\_id uuid REFERENCES organisations,

  substitute\_id uuid REFERENCES substitutes,

  active bool DEFAULT true,

  added\_at timestamp

)

\-- Absences / open slots

absences (

  id uuid PRIMARY KEY,

  org\_id uuid REFERENCES organisations,

  posted\_by uuid REFERENCES org\_admins,

  absent\_staff\_name text,

  date date NOT NULL,

  start\_time time NOT NULL,

  end\_time time NOT NULL,

  role text,               \-- 'Year 5 English' | 'Reception Admin'

  pay\_rate decimal,

  notes text,

  status text DEFAULT 'open',  \-- 'open' | 'claimed' | 'cancelled'

  claimed\_by uuid REFERENCES substitutes,

  claimed\_at timestamp,

  ai\_rankings jsonb,       \-- stored Claude ranking output

  viewers\_count int DEFAULT 0,

  created\_at timestamp

)

\-- Claims (atomic, race-condition safe)

claims (

  id uuid PRIMARY KEY,

  absence\_id uuid REFERENCES absences UNIQUE,  \-- one claim per absence

  substitute\_id uuid REFERENCES substitutes,

  claimed\_at timestamp DEFAULT now()

)

\-- Notifications log

notifications (

  id uuid PRIMARY KEY,

  substitute\_id uuid REFERENCES substitutes,

  absence\_id uuid REFERENCES absences,

  type text,               \-- 'new\_slot' | 'slot\_filled' | 'claim\_confirmed'

  sent\_at timestamp,

  read\_at timestamp

)

### Claude API — Matching Call

// /api/rank-substitutes

const response \= await fetch("https://api.anthropic.com/v1/messages", {

  method: "POST",

  headers: { "Content-Type": "application/json" },

  body: JSON.stringify({

    model: "claude-sonnet-4-20250514",

    max\_tokens: 1000,

    messages: \[{

      role: "user",

      content: \`You are a substitute matching engine. Rank these substitutes

for this absence and return structured JSON only.

ABSENCE REQUIREMENTS:

${JSON.stringify(absenceRequirements)}

SUBSTITUTE POOL:

${JSON.stringify(substitutePool)}

Rank from best to worst match. For each substitute return:

\- match\_score (0-100)

\- recommendation (one sentence, specific and useful)

\- flags (array of positive signals)

\- warnings (array of concerns, if any)

Return ONLY valid JSON:

{

  "rankings": \[

    {

      "substitute\_id": "uuid",

      "match\_score": 94,

      "recommendation": "Best match — certified Year 5, zero cancellations, closest to school",

      "flags": \["Certified Year 5 English", "0 cancellations (30 days)", "2.1km away", "Available Thursdays"\],

      "warnings": \[\]

    }

  \]

}\`

    }\]

  })

});

### Real-time Claiming — Race Condition Prevention

The most critical technical piece: two substitutes tapping "Claim" simultaneously. Handled with a Supabase unique constraint on the claims table \+ optimistic UI:

// /api/claim-slot

const { data, error } \= await supabase

  .from('claims')

  .insert({

    absence\_id: absenceId,

    substitute\_id: substituteId,

    claimed\_at: new Date()

  });

// UNIQUE constraint on absence\_id means only first insert succeeds

// Second attempt returns error → "slot already claimed" message

if (error?.code \=== '23505') {

  return { success: false, message: 'Slot just filled by someone else' };

}

// Success: update absence status \+ broadcast via Realtime

await supabase

  .from('absences')

  .update({ status: 'claimed', claimed\_by: substituteId, claimed\_at: new Date() })

  .eq('id', absenceId);

// Realtime broadcast fires automatically via Supabase

### Cost Model

| Operation | Est. tokens | Est. cost |
| :---- | :---- | :---- |
| AI matching per absence posted | \~600 input, \~400 output | \~$0.005 |
| **Per absence posted** | — | **\~$0.005** |

At $49/month per organisation posting \~30 absences/month, AI cost is $0.15/month per org — negligible. The real costs are hosting (Vercel free tier) and Supabase (free tier handles course volume comfortably). This is the best unit economics of any idea in the session.

---

## Four-Week Build Plan

### Week 1 — PRD & Architecture (Current)

- ✅ Problem definition  
- ✅ Competitive analysis  
- ✅ Feature scoping and MVP  
- ✅ Database schema  
- ✅ API architecture  
- ✅ Working prototype (HTML) for review  
- ✅ AI matching prompt design

### Week 2 — Build

**Days 1–2: Foundation**

- Next.js \+ Supabase \+ Tailwind scaffold  
- Supabase Auth (admin \+ substitute roles)  
- Database schema migration with RLS policies  
- Organisation creation \+ substitute pool setup flow

**Days 3–4: Core mechanic**

- Post absence form (admin)  
- Claude matching API route  
- Ranked substitute display with AI reasoning  
- Notification dispatch (Supabase Realtime)

**Days 5–6: Claiming flow**

- Live slot feed (substitute view)  
- Real-time updates via Supabase Realtime subscriptions  
- Claim button → atomic transaction → FILLED stamp  
- Success confirmation \+ My Shifts update

**Day 7: Admin dashboard**

- Active postings with live status  
- Fill rate stats  
- Re-notify button  
- Basic earnings tracker for substitutes

### Week 3 — Security

- Supabase Row Level Security (orgs isolated, subs only see their pools)  
- Auth middleware on all protected API routes  
- Race condition handling (unique constraint \+ error messaging)  
- Rate limiting on claim endpoint (prevent abuse)  
- Input sanitisation on all form fields  
- OWASP top 10 review  
- Environment variables audit (no keys in client)  
- Substitute pool invitation validation (email only, no open signup)

### Week 4 — Maintenance

- Real-time performance testing (multiple subs claiming simultaneously)  
- Error handling: graceful degradation if Claude API fails (fall back to unranked list)  
- Edge cases: admin cancels slot mid-claim, substitute cancels after claiming  
- Mobile polish: notification handling, safe area insets  
- Monitoring: log fill rates, claim times, AI matching confidence scores  
- Beta: 2 real organisations, 5–10 real substitutes each  
- Soft launch preparation

---

## Monetisation (Designed In, Not Activated at Launch)

**Free trial: 30 days, full features** No credit card required. Every organisation gets to feel the product work before paying.

**Starter — $49/month per organisation**

- Up to 20 substitutes in pool  
- Unlimited absence postings  
- AI matching \+ real-time claiming  
- Basic analytics (fill rate, average fill time)

**Growth — $99/month per organisation**

- Up to 100 substitutes  
- Multi-admin access  
- Advanced analytics and absence trend reporting  
- Priority notifications (SMS — post-course)  
- Lesson plan / notes attachment

**The conversion trigger:** The free trial ends. The admin has already filled 15 slots without making a single phone call. The upgrade sells itself — $49/month is less than one hour of their time saved every week.

**Unit economics:** At $49/month, 100 paying organisations \= $4,900 MRR. 500 organisations \= $24,500 MRR. Both are achievable within 12 months with direct sales to schools. No paid acquisition needed — one conversation with a principal, one demo, one sign-up.

---

## Go-To-Market — First 30 Days

**Week 1 post-launch:** Call 10 school principals or office managers directly. Ask one question: "How do you currently find cover when a teacher calls in sick?" Listen. If they describe phone calls and group texts, offer a free 30-day pilot.

**Week 2:** Onboard 3 pilot schools. Be present. Help them upload their substitute pool. Ensure first absence is posted and filled live. That moment — slot filled in 8 minutes with zero phone calls — is your entire sales pitch for every future customer.

**Week 3:** Ask pilot schools for one referral each. School administrators talk to each other. Word of mouth in the education sector is fast and trusted.

**Week 4:** First paying customers. Flip pilots to $49/month. Document the fill-time improvement as a case study.

---

## Key Risks and Mitigations

| Risk | Likelihood | Severity | Mitigation |
| :---- | :---- | :---- | :---- |
| Substitutes don't download the app | High | High | SMS fallback (v2); ensure claiming is web-based, no app install required |
| Race condition on claiming | Medium | High | Unique DB constraint \+ optimistic UI handles this gracefully |
| Claude API latency slows posting | Low | Medium | Show unranked list immediately, AI ranking loads async |
| Organisation churns after one bad fill | Low | High | Fill rate monitoring \+ re-notify feature prevents unfilled slots |
| Schrole or Deputy adds AI matching | Low | Medium | Network effects \+ org data moat takes 12+ months to replicate |

---

## Success Metrics — Course Demo

By end of Week 4, the prototype should demonstrate:

- Full admin → post → AI rank → notify → claim → filled loop working end-to-end  
- Real-time slot stamping FILLED when claimed (live, in front of the assessor)  
- AI matching showing ranked substitutes with specific reasoning  
- Row Level Security confirmed (org A cannot see org B's data)  
- At least 2 real organisations onboarded in beta  
- At least one absence filled end-to-end with real users

**The demo sequence that wins:**

1. Admin posts absence — 30 seconds  
2. Claude returns ranked substitutes with reasoning — 2 seconds  
3. Notification fires to substitute device — instant  
4. Substitute claims — 90 seconds  
5. Admin dashboard stamps FILLED — instant, live

Total elapsed time on demo: under 3 minutes. That's the product. That IS the pitch.

---

## Appendix — Why SubFill Over FridgeFix For This Course

SubFill was chosen over FridgeFix for the following reasons, documented for transparency:

**Stronger market position:** Enterprise incumbents (Frontline, SmartFind) ignore small organisations. Generic platforms (Deputy, Homebase) treat substitute matching as a feature. SubFill owns the gap with a purpose-built product.

**Cleaner moat:** Organisational switching costs, substitute pool data, and reliability history compound over time. Consumer apps churn; B2B tools stay for years.

**Simpler build:** No vision API, no community graph, no multi-layered AI pipeline. Core complexity is real-time claiming and AI matching — both well within the 4-week window.

**Better unit economics:** $49/month B2B subscription vs consumer freemium. One sale \= 12 months of revenue. No paid acquisition needed.

**AI showcase:** Claude matching engine with ranked recommendations and reasoning is a genuine, demonstrable AI feature — not a wrapper around a commodity prompt.

---

*Document prepared for course submission — Week 1 deliverable* *Build commences Week 2* *The idea: fill any absence in under 30 minutes. No phone calls. No chaos.*  
