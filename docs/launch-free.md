# RGPV Connect — Free-Tier Deployment & Launch Guide

> Goal: run the whole platform on **₹0/month** infra and get to 100 verified RGPV
> students at one college. RGPV Connect is free and open-source — there is nothing
> to sell, so "free tier" here means free *infrastructure*, and the launch is a
> pure adoption + retention validation.

## What we hide at launch (until we have 100 verified users)

Hide from the nav, leave in the codebase:

- Feed, Groups, Jobs board, Campus listings (all built, all hidden until density)
- Phone OTP (defer — email magic-link is free; phone OTP costs per send)
- Web Push fan-out infra (build later, after first 100 retention data points)
- Native-Indian-language UI (defer — English-first is fine for RGPV)

The point of hiding is **focus and density**, not monetization — everything here
is and stays free.

## What stays visible (the launch MVP)

The user's first session has exactly one purpose: **check their result, get a
share-card, optionally invite a friend**. Everything else is friction.

| Surface | Why it's in the MVP |
|---|---|
| Email magic-link signup | Free auth; no Phone-OTP cost |
| Enrollment verification (already built) | THE moat |
| `/results/me` — semester result + GPA calc | The killer feature, the reason they come |
| Share card → WhatsApp deep-link | The viral loop |
| `/notes` + `/papers` (view-only, seeded by us) | Reason to come back between results |
| `/u/[id]` profile + `/messages` DM | Reason to invite friends ("DM me on RGPV Connect") |
| `/notifications` (in-app, no push yet) | Read-receipts on DMs |
| PWA install prompt | Free retention lever |

## Free infra stack (₹0/mo until ~5–10k MAU)

| Layer | Service | Free tier limits | Why it's right |
|---|---|---|---|
| **Hosting (Next.js)** | Vercel Hobby | 100GB bandwidth/mo, unlimited requests, 10s function timeout | Built for Next.js 15, zero ops |
| **Postgres** | Neon Free | 0.5 GB storage, 191 compute-hours/mo, autosuspend after 5 min idle | Same Prisma schema, no code changes |
| **Python result-worker** | Fly.io Hobby | 3 shared-cpu-1x VMs (256 MB each), 3 GB persistent volume | Best fit for the fetcher; the only piece Vercel can't run |
| **File storage (notes/papers PDFs)** | Cloudflare R2 | 10 GB storage, **zero egress fees**, 1M Class A ops/mo | Zero egress is critical — every notes download is free |
| **Email (magic links)** | Resend | 3,000 emails/mo, 100/day | ~100 signups/day is plenty for one college |
| **Push notifications** | Self-host with VAPID + `web-push` | Unlimited, runs on your Vercel functions | No vendor — VAPID is free forever |
| **Analytics** | Plausible / PostHog (self-host) or Vercel Web Analytics | Self-hosted = unlimited & privacy-safe | Track conversion events without selling data |
| **Error tracking** | Sentry Developer | 5,000 errors/mo, 1 user | Catches the fetcher edge cases |
| **Domain** | `rgpv-connect.vercel.app` | Free | Buy `.in` only when launching publicly |
| **CI** | GitHub Actions | Public repo: unlimited minutes | Already wired — and free forever for a public OSS repo |

Total: **₹0/mo until ~5–10k MAU.** As the project grows, infra (not users) is the
only cost. See ["When infra needs paying for"](#when-infra-needs-paying-for).

### Result worker secrets (Fly.io)

The worker needs an AZCaptcha key to solve RGPV captchas in production:

```bash
fly secrets set \
  AZCAPTCHA_API_KEY=your_key_here \
  CAPTCHA_PROVIDER=azcaptcha \
  REDIS_URL=redis://... \
  ALLOWED_ORIGINS=https://your-domain.vercel.app
```

Never commit `AZCAPTCHA_API_KEY` — it lives in `.env` locally and Fly secrets
in production. Cost is ~$0.40 per 1,000 captchas.

### Watch-outs (limits that will bite first)

- **Neon autosuspend = cold start.** Free tier suspends after 5 min idle. First
  request after idle = 500–1000ms. Mitigation: a Vercel cron that hits
  `/api/health` every 4 min keeps it warm during waking hours.
- **Vercel Hobby = non-commercial.** RGPV Connect is a free, non-commercial
  project, so Hobby is a fine fit. If the project ever takes sponsorship or needs
  more headroom, move to a self-hosted VPS or Vercel Pro.
- **Vercel function timeout = 10s.** The result-fetch proxy MUST complete in
  <10s. With AZCaptcha (~3–11 s per fetch) this is comfortably within budget.
  Cache aggressively in Postgres (`ResultRecord` row) and only refresh on user
  request with a 6-hour TTL.
- **R2 1M ops/mo.** A `HEAD`/`GET` per PDF view = 1 op each. Plenty for 10k PDF
  views/mo. Use signed-URL caching to dedupe.
- **Resend 100/day.** = 100 signups + 100 magic-link-resends/day. Adequate for
  one college.

## The single acquisition loop

This is the ONLY growth tactic for the first 100 users:

```
RGPV publishes semester results day
       ↓
You DM the rgpv-connect.vercel.app link into 5 specific WhatsApp groups
(your branch + senior batch + junior batch from your college)
       ↓
Student opens link → instant result lookup (no signup needed for view-only)
       ↓
"See your GPA + share card" → email-magic-link signup gate
       ↓
Verified → share card with their name + GPA → "Share to WhatsApp" deep-link
       ↓
Friend in their group sees the card → opens link → loop
```

Three properties to enforce:

1. **No signup wall before result lookup.** A signed-out user can punch in any
   enrollment number and see the result. Signup is gated only on "see history /
   share with my name."
2. **Share card has the rgpv-connect.vercel.app URL on it.** Free organic reach.
3. **First DM in a WhatsApp group beats every paid ad.** Drop it personally in 5
   groups on results day. Don't automate this until you've done it manually 3
   cycles.

## Flagship college: UIT-RGPV Bhopal (decided)

~2.5k BTech/MTech students; the university's own institute, so the verification
story is cleanest (no friction explaining "yes we're affiliated to RGPV — you ARE
RGPV"). Target density: ≥30% (≥750 verified) before launching anywhere else.

Acquisition surfaces specific to UIT:
- UIT BTech branch + year WhatsApp groups (CSE, IT, EC, ME, CE × 4 years)
- UIT placement cell + senior alumni network
- UIT student-body groups on Telegram
- Physical tabling at the UIT campus during results week

Critical risk to acknowledge: UIT students are NOT representative of the ~150k
RGPV-affiliated-college students. A working playbook at UIT is necessary but not
sufficient evidence the model generalizes. Replicate at one affiliated college
(SGSITS or LNCT Bhopal) before declaring product-market fit.

## What to build next (in order, ₹0 infra)

1. **Hide everything except results + notes + papers + profile + DMs** behind a
   feature flag.
2. **Email magic-link login** via Resend (drop Google OAuth as primary, keep as
   secondary).
3. **Result-lookup-without-signup** — anyone can look up an enrollment; signup
   gates only "save history / share with my name."
4. **Share card** via `@vercel/og` + `/api/og/result/[hash]` + WhatsApp deep-link
   from `/results/me`.
5. **PWA manifest + service worker** via `@serwist/next` + post-result install
   prompt.
6. **Self-hosted analytics** + conversion events: `view_result`, `signup_start`,
   `signup_done`, `verify_done`, `share_clicked`.
7. **Sentry** wired to capture fetcher failures.
8. **Deploy to Vercel + Neon + Fly.io free tiers**, single staging URL.
9. **Wake-up cron** keeping Neon warm during 7am–11pm IST.
10. **Soft-delete on posts** (defensive, before anyone posts).

That's the launch. No payments, no premium, no gates — pure adoption + retention
validation.

## Success metric for this phase

| Metric | Threshold to continue |
|---|---|
| Verified users in flagship college | ≥100 in 4 weeks |
| Week-2 retention (return to check anything) | ≥30% |
| Share-to-WhatsApp clicks per verified user | ≥0.5 (each user invites half a friend on average) |

If any one of these misses: don't add features, don't spend money — fix the
funnel. The plan is wrong if these don't land.

## When infra needs paying for

There is no revenue, so infra is funded by the maintainer(s) or by sponsorship /
donations (e.g. GitHub Sponsors, Open Collective) — never by charging students.
Costs only appear as the project scales past the free tiers:

- **Vercel Pro ($20/mo)** — only if bandwidth/limits are exceeded or more build
  concurrency is needed. Hobby is fine while non-commercial.
- **Neon Scale ($19/mo)** — only when sustained DAU ≥ 200 (autosuspend cold
  starts hurt UX above that).
- **Resend ($20/mo)** — only when signups > 100/day for 3 days running.
- **`.in` domain (~₹800/yr)** — only when doing public PR.

Total budget to validate: **₹0**. Total budget through 500 users: **~₹0–₹2,000**,
covered by the maintainer or a small sponsorship pool — not by users.
