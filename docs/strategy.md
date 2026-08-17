# RGPV Connect — Strategy & Roadmap

> RGPV Connect is a free, open-source, community-built project. This document is
> the product roadmap and the thinking behind it. There is no monetization plan —
> success is measured in verified students, active contributors, and retention,
> not revenue.

## TL;DR — the thesis

**Be the verified-identity graph + RGPV-specific data layer that a WhatsApp
group can't be.** The value that no chat app can reproduce is a network where
every member is cryptographically bound to a real RGPV enrollment number. Build
that harder than anyone bothers to, keep everything free, and let the community
own it.

Three bets, in order:

1. **Identity is the moat, not features.** A WhatsApp group has 200 unverified
   people; we have 200 verified-to-a-real-RGPV-enrollment people. That single
   property is what makes the directory, results history, and campus features
   trustworthy in a way chat apps never can be.
2. **Win results-day, then keep them.** Results-day is the only week of the
   semester where ~100% of RGPV students load the same URL at the same time.
   Own it (faster than the official portal, with GPA calc, semester history,
   class rank, branch percentile, share cards) and you get a free 4×/year
   reactivation pulse — which Web Push then converts into daily habit.
3. **Keep it free and open.** Notes, papers, feed, and campus features are the
   commons. The project is open-source so students can audit it, self-host it,
   and improve it. Growth comes from usefulness and word of mouth, not spend.

## Why this can work (validated mechanics)

These mechanics were confirmed by public case studies and are directly relevant
to a free PWA aimed at Tier-2 India:

| Claim | Confidence | Source |
|---|---|---|
| PWAs drive real engagement lift — Twitter Lite +65% pages/session, -20% bounce; Hotstar 2× weekly card views after INP optimization; MakeMyTrip 3× mobile-web conversion; Ola re-engaged 20% of uninstalled users | High | [web.dev/twitter](https://web.dev/case-studies/twitter), [web.dev/hotstar-inp](https://web.dev/case-studies/hotstar-inp), [web.dev/make-my-trip](https://web.dev/case-studies/make-my-trip), [Google/Ola](https://developers.google.com/web/showcase/2017/ola) |
| Web Push works at scale — Twitter Lite delivered 10M+ pushes/day, 250k DAU launched from homescreen 4×/day | High | web.dev/twitter |
| Vertical communities on top of a utility retain users — Apna runs 70+ professional communities for peer learning | Medium | [Apna / Google Cloud](https://cloud.google.com/customers/apna) |

**Honest caveat:** there are no comparable open-source case studies for a
single-university student network, so adoption and retention numbers are unknown.
Validate cheaply, don't plan against numbers we can't verify.

## What's a real moat vs. what's illusory

| Property | Verdict | Why |
|---|---|---|
| **Verified-enrollment graph** | **Real** | Bound to a real RGPV enrollment number; cannot be reproduced in a WhatsApp group |
| **Results data + history** | **Real** | We own a longitudinal record across semesters per user; the official portal does not |
| **Trust on campus listings** | **Real** | Verified identity solves the "is this person actually from my college" problem WhatsApp groups have |
| Notes/papers content | **Illusory** | WhatsApp groups already share this free; we can't win on content alone — but we can organize it better |
| Social feed / DMs / groups | **Illusory** | WhatsApp / Instagram / Discord do this 10× better |
| "Network effects" in general | **Real but slow** | Real, but only above ~30% density in a given college — see "the cold-start trap" |

## The cold-start trap (the biggest product risk)

Network effects are a step function: density below ~30% of a college's students
is useless; above it is sticky. Launching all features everywhere at once spreads
early users thin and never crosses the density threshold in any one college.

**Fix: launch at UIT-RGPV Bhopal first and get to >30% verified density (~750 of
~2.5k students) before launching anywhere else.** UIT is the university's own
institute, so the verification story is frictionless, and ~2.5k students is a
tractable density target.

Risk: UIT students are NOT representative of the ~150k RGPV-affiliated-college
users. A working playbook at UIT is necessary but not sufficient — replicate at
an affiliated college (SGSITS / LNCT Bhopal) before declaring product-market fit.

## Feature-gap diff against the current build

### Drop / deprioritize

- **Social feed (university scope)** — never reaches density. Keep college scope
  only; defer university scope.
- **Generic groups feature** — too open-ended. Replace with two specific group
  types: (a) branch + semester cohorts (auto-created, auto-joined on
  verification), (b) study/placement-prep cohorts (auto-created per batch).
- **All payment/premium code paths** — the project is free. Any `isPremium`
  gating, Razorpay wiring, or take-rate logic should be removed rather than
  hidden. Keep jobs and campus listings as free features.

### Keep + harden

- **Enrollment verification** — this is THE moat. Harden it: add ID-card OCR
  fallback, college-email-domain check, and a soft "pending verified" badge.
- **Result lookup + GPA calculator** — the killer feature. Add: semester
  history, per-subject trends, branch rank, "share card" image generation.
- **Campus listings** — verified-only, with a trust score (verified + age on
  platform + listings completed). Free to post and browse.
- **Jobs board** — verified students and (later) verified recruiters can post
  roles; students filter by branch/year. No paid posting.

### Add (currently missing, high impact)

| Feature | Why | Cost |
|---|---|---|
| **Web Push (results-day blast)** | Single biggest retention lever | 2 days eng |
| **PWA install + manifest hardening** | Without `beforeinstallprompt` UX, install never happens | 1 day eng |
| **Share cards (OG image + WhatsApp deep-link)** | Viral loop: a GPA card shared in a WhatsApp group is the acquisition channel | 3 days eng |
| **College email verification (fallback to enrollment)** | Lowers verification friction → growth | 2 days eng |
| **Placement outcome graph** ("X students from CSE'24 went to TCS/Infosys/Wipro") | Defensible RGPV-only data nobody else has; a public good | 1 week eng + data collection |
| **Branch / batch leaderboards** | Engagement loop tied to results-day | 2 days eng |
| **Analytics (Plausible or PostHog self-hosted)** | Privacy-respecting, open-source, no third-party data sale | 1 day eng |
| **Notes upload + moderation queue** | Notes stay free, but only verified students upload — that's the trust layer | 3 days eng |
| **Phone-OTP / email-magic-link login** | Most RGPV students lack a .edu Google account | 2–3 days eng |

## PWA tactics (web.dev-validated)

The mechanics that actually moved metrics for consumer web apps in India:

1. **Service worker + app shell architecture** — for sub-second repeat loads.
   Next.js: use `@serwist/next` with App Router.
2. **Web Push with VAPID** — the retention killer-feature. VAPID is free and
   self-hosted; no vendor.
   - **Results-day blast:** when RGPV publishes a semester's results, push to
     every user in that semester. Highest-ROI growth lever in the plan.
   - **Deadline reminders:** placement deadlines, exam form dates.
   - Store `PushSubscription` in Postgres per user; fan out from a server action
     or background worker.
3. **`beforeinstallprompt` with a clear "Add to Home" CTA** after a value moment
   (e.g. right after a results check) — converts far better than the vanilla
   browser prompt.
4. **INP < 200ms** — React 19 + RSC helps; audit the bundle on `/results/me` and
   `/feed`.
5. **Offline shell for results-history** — last-fetched results visible offline
   is a reason to install.

Stack picks (all free / open-source):
- **Service worker:** `@serwist/next`.
- **Push:** `web-push` + a `PushSubscription` Prisma model.
- **OG / share cards:** `@vercel/og` for dynamic images.
- **Analytics:** Plausible or PostHog, self-hosted.

## Phased roadmap

### Phase 0 (now → 2 weeks): "make it a real, runnable open-source project"

| | |
|---|---|
| **Goal** | Anyone can clone, run locally with mock data, and sign up on staging |
| **Build** | (1) Auth that works without Google OAuth in dev (dev credentials / magic-link). (2) PWA manifest + service worker + offline shell. (3) Web Push: VAPID, subscription storage, fan-out. (4) Share cards via `@vercel/og`. (5) Self-hosted analytics with privacy-safe events. (6) Remove all payment/premium code paths. |
| **Contributor enablement** | `CONTRIBUTING.md`, issue/PR templates, `good first issue` labels, a chosen open-source LICENSE, seeded local data so no external accounts are needed |
| **Success metric** | A new contributor can go from clone to running app in <15 minutes |

### Phase 1 (weeks 2–8): "win one college, get to density"

| | |
|---|---|
| **Goal** | >30% verified-student density at UIT-RGPV Bhopal (~750 verified) |
| **Build** | (1) College-email verification fallback. (2) ID-card OCR for non-college-email cases. (3) Branch+semester auto-cohorts. (4) Results-day push blast. (5) Branch leaderboards. (6) Free notes/papers, verified upload only. |
| **Growth tactics** | (a) Drop the GPA share-card into branch + batch WhatsApp groups on results day. (b) Tabling at UIT during results week. (c) "Verified topper" badges as a status hook. (d) Pre-seed notes from senior students for week-1 utility. (e) Recruit 3–5 student maintainers from the flagship college. |
| **Success metric** | ≥30% of UIT-RGPV BTech students verified; ≥40% of verified return in week 2 |
| **Riskiest assumption** | That verified enrollment is a strong enough hook to overcome "yet another app" fatigue. Validate by manually onboarding 100 students and measuring week-2 retention before scaling. |

### Phase 2 (months 2–6): "expand to 5 colleges + grow the contributor base"

| | |
|---|---|
| **Goal** | 5 RGPV colleges at >20% density; a self-sustaining contributor community |
| **Build** | (1) Placement outcome graph (community data collection, published as a public good). (2) Campus listings hardened with trust score. (3) Moderation tooling (flag + soft-delete queue). (4) Notification scheduler (deadline reminders). |
| **Community** | Campus-ambassador / student-maintainer program; monthly contributor call; a public roadmap board |
| **Success metric** | 5 colleges at >20% density; ≥10 recurring external contributors |
| **Riskiest assumption** | That density compounds across colleges. Colleges 6–10 are harder than 1–5; build the ambassador program early. |

### Phase 3 (months 6–12): "consolidate the moat, make it durable"

| | |
|---|---|
| **Goal** | 25 colleges; the placement outcome graph as a published artifact; project can survive the original author stepping back |
| **Build** | (1) Peer-tutoring / study-buddy matching using verified-GPA signal (free). (2) Public "RGPV placement outcomes 2024" report — SEO + student value. (3) Governance docs (maintainer roles, decision process) so the project is community-owned. |
| **Success metric** | 25 colleges at >20% density; ≥3 maintainers with merge rights beyond the founder |
| **Riskiest assumption** | That the community can sustain the result-scraper and moderation load. Reduce single-points-of-failure (see weaknesses). |

### Phase 4 (months 12–24): "generalize the playbook (optional)"

| | |
|---|---|
| **Goal** | Prove the model can help students at a second state technical university, if the community wants it |
| **Build** | (1) Generalize the enrollment-parser layer (each university has its own format). (2) Generalize the result fetcher (the hardest engineering work — each portal differs). |
| **Note** | This stays RGPV-first. Generalizing is a "if contributors from another university show up" path, not a mandate. |

## Riskiest assumptions to validate (in order)

1. **Verified students retain in week 2** — fix the funnel at any sign of <30%
   week-2 retention; do not scale a leaky bucket.
2. **Verified enrollment is a strong-enough hook** vs. WhatsApp/Telegram college
   groups — validate with manual onboarding before scaling.
3. **PWA install rate is meaningful on Android Chrome in India** — instrument
   from day 1; if <2% install after the value moment, reconsider a TWA wrapper.
4. **The community can sustain the project** — the scraper and moderation are
   ongoing work; recruit maintainers before you need them.

## Honest weaknesses in the current plan

Things worth pushing back on if reviewing cold:

1. **Too many features for zero users.** Feed + groups + jobs + campus listings +
   DMs + notifications is a year-2 feature set, not a v1. Cut to results +
   verification + notes + push, ship density in one college, add the rest after
   retention proves out.
2. **No analytics.** We have no idea what users do. Self-hosted Plausible/PostHog
   day 1.
3. **No moderation tooling.** A verified-only platform that lets users post freely
   will get a defamation complaint eventually. Build a flag + soft-delete queue
   before the social feed goes wide.
4. **Result fetcher is a single point of failure and a legal grey area.** When
   RGPV blocks the IP or sends a notice, every retention loop breaks. Mitigations:
   (a) seek official/consented access via the placement office, (b) keep fetch
   logic isolated and rate-limit hard, (c) cache aggressively so the fetcher is a
   freshness optimization, not a hard dependency.
5. **No referral / viral loop yet.** Share cards are the cheapest one to build —
   ship them in Phase 0.
6. **No DPDP compliance work.** India's DPDP Act applies. Need a privacy policy,
   a data-deletion endpoint, and an audit log — doubly important for a project
   that handles student PII openly.
7. **Google OAuth only is a launch blocker** — most RGPV students lack a .edu
   Google account. Add phone-OTP and email-magic-link login.
8. **Bus factor.** A solo-maintained open-source project dies when the author gets
   busy. Recruiting co-maintainers is a Phase 1–2 priority, not an afterthought.

## Concrete next-2-weeks build list

In execution order:

1. **Remove payment/premium code paths** — delete `isPremium` gating, any
   Razorpay wiring, and take-rate logic; keep jobs/listings free.
2. **Contributor scaffolding** — `CONTRIBUTING.md`, `CODE_OF_CONDUCT.md`,
   issue/PR templates, a chosen LICENSE, `good first issue` labels.
3. **PWA shell** — `@serwist/next`, manifest, install CTA after results check.
4. **Web Push** — VAPID keys, `PushSubscription` model, subscribe action,
   fan-out function shared by `notify()`.
5. **Share cards** — `/api/og/result/[hash]` via `@vercel/og`; "Share to
   WhatsApp" deep-link from `/results/me`.
6. **Phone-OTP / email-magic-link login** — Auth.js Credentials/Email provider;
   keep Google OAuth as secondary.
7. **Self-hosted analytics** — instrument 5 events: verify start, verify done,
   result check, share clicked, install.
8. **Soft-delete + flag queue** — `Post.flaggedAt`, admin route to triage.
9. **Privacy policy + DPDP data-deletion endpoint.**
10. **Auto-cohorts** — on verification, auto-join branch+semester group.
11. **Results-day push hook** — manual trigger from an admin route; automate later.

After this, validate Phase 1 in one college before adding anything else.
