<div align="center">

<img src=".github/readme/banner.png" alt="RGPV Connect: results, notes and a student network where every profile is tied to a real RGPV enrollment number" width="100%">

<br>

**Exam results, notes and papers, and a campus network for RGPV University, Bhopal.<br>Every profile is tied to a real enrollment number, proved by fetching that student's own result.**

<br>

[![Next.js 15](https://img.shields.io/badge/Next.js-15-1e1b4b?logo=nextdotjs&logoColor=white)](https://nextjs.org)
[![React 19](https://img.shields.io/badge/React-19-1e1b4b?logo=react&logoColor=61dafb)](https://react.dev)
[![TypeScript strict](https://img.shields.io/badge/TypeScript-strict-4f46e5?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Tailwind CSS 3](https://img.shields.io/badge/Tailwind_CSS-3-4f46e5?logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![Postgres with Prisma 5](https://img.shields.io/badge/Postgres-Prisma_5-4f46e5?logo=postgresql&logoColor=white)](https://www.prisma.io)
[![Auth.js v5](https://img.shields.io/badge/Auth.js-v5,_Google-4f46e5)](https://authjs.dev)
[![FastAPI worker](https://img.shields.io/badge/FastAPI-Python_3.11-1e1b4b?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![pnpm and Turborepo](https://img.shields.io/badge/pnpm_9-Turborepo-1e1b4b?logo=pnpm&logoColor=white)](https://turbo.build)
<br>
[![Status: early](https://img.shields.io/badge/status-early,_no_students_on_it_yet-4f46e5)](#how-far-to-trust-it)
[![Free](https://img.shields.io/badge/free-no_paid_tier,_no_ads-4f46e5)](#the-rules-it-keeps)
[![Licence: MIT](https://img.shields.io/badge/licence-MIT-1e1b4b)](#licence)

[What it does](#what-it-does) · [The rules it keeps](#the-rules-it-keeps) · [How far to trust it](#how-far-to-trust-it) · [How it works](#how-it-works) · [Run it yourself](#run-it-on-your-machine) · [Docs](docs)

</div>

<br>

<p align="center">
  <img src=".github/readme/screens.png" alt="Three screens: a verified profile decoded from the enrollment number 0151CS21001; a semester result lookup with SGPA, CGPA and the subject table; and the notes listing filtered by subject" width="100%">
</p>

## Why RGPV Connect

A college WhatsApp group has two hundred people in it, and nobody can say who is really a student. Results day sends everyone to the same slow portal. Notes and old papers are shared once and scroll away.

RGPV Connect keeps the useful parts in one place. It looks up a semester result from the official portal. It lists notes and previous-year papers by subject. And it puts a campus network on top, with one property a chat group cannot copy: **every profile is bound to a real RGPV enrollment number.** To get verified, a student enters their number, the result worker fetches their actual result from RGPV, and the number itself is decoded into college, branch and batch. Nothing about where you study is typed by hand.

It started as a plain results-lookup site. This repository is the rewrite as a free, open-source monorepo.

## What it does

| | |
|---|---|
| **Result lookup** | Anyone can type an enrollment number, no account needed, and get the name, SGPA, CGPA, pass or fail status and the subject table. The result worker fetches it live from `result.rgpv.ac.in`. A found result is cached for six hours, so results-day repeats are instant and free. |
| **My Results** | A verified student fetches every semester they have sat, one semester at a time with progress shown. A semester already recorded as PASS or FAIL is never fetched again. The page charts SGPA and CGPA, and shows where the student stands in their branch and batch once 20 or more of them are verified. |
| **Share card** | A card with the SGPA, CGPA and (for verified students) their name, shared to WhatsApp or saved as an image. The link holds a random token, never the enrollment number. |
| **Calculator** | A what-if for next semester, pre-filled with the real subjects and credits, and the average SGPA needed to reach a target CGPA. |
| **Verified profiles** | Verification fetches a real result for the number, which proves it belongs to you. The number is decoded into college, branch and batch, and the student joins their college and batch groups. One account per number; a student whose number was taken can file a claim. |
| **Notes and papers** | Listed by branch, semester and subject. Verified students upload PDFs or photos straight to storage; reviewers publish or send them back with a note. Ratings and download counts. |
| **Results day** | An admin checks five sample numbers against the portal, then the app fetches the semester for the whole batch and notifies everyone, by Web Push if they allow it. |
| **Messages and notifications** | One-to-one messages with read receipts. Notifications for results, reviews and messages, with per-type switches for what reaches the phone. |
| **Installable app** | Add to home screen; My Results opens offline. |
| **Feed, directory, groups** | Built, and switched off until a college reaches about a third of a batch verified (`ENABLED_FEATURES=network`). The feed is college-only, with reporting: three reports hide a post until a reviewer decides. |
| **Jobs and campus market** | Built, and switched off with the network (`ENABLED_FEATURES=campus`). Jobs target branches and batches and close on a date. The market is college-only, with no payments and no commission. |
| **Admin** | Review queue, results-day runner, worker health and captcha balance, data deletion requests and identity claims, batch sizes and roles. Every decision is written to an audit log. |

## The rules it keeps

- **Every verified profile is backed by a fetched result.** Typing a number is not enough. The worker must return that student's result from RGPV.
- **College, branch and batch are derived, never self-reported.** They come from the enrollment number, parsed on the server by `@rgpv/shared` and mirrored in Python in the worker, so both sides decode the same way.
- **It is free, and stays free.** No paid tier, no commission, no ads. The last premium code path was removed in the migration `remove_premium_tier`. Contributions that add paywalls are declined in [`CONTRIBUTING.md`](CONTRIBUTING.md).
- **The result fetcher is best effort.** Every caller must degrade cleanly when the worker is down or the portal rejects a request.
- **Secrets stay out of the browser.** The captcha solver key lives only in the worker's `.env`, never in the web app.
- **Student data is treated as personal data.** Report a vulnerability privately, as [`SECURITY.md`](SECURITY.md) asks. India's DPDP Act applies.
- **Not affiliated with the university.** Result data belongs to RGPV.

## How far to trust it

> [!IMPORTANT]
> **RGPV Connect is early.** The code runs end to end on a laptop with the seeded demo user, and the worker has fetched a real result from the live portal. **No student has signed up yet**, and there is no public address. The launch plan in [`docs/launch-free.md`](docs/launch-free.md) is to open at one college first, UIT-RGPV Bhopal, on free hosting tiers.

Things to know before relying on it:

- **The result worker scrapes a government portal.** `result.rgpv.ac.in` is a legacy ASP.NET WebForms site behind a five-character image captcha. The worker replays the full session, pays [AZCaptcha](https://azcaptcha.com) about $0.40 per thousand captchas to solve it, waits about six seconds because the portal rejects a form posted sooner, and parses the HTML. A change to the portal's markup breaks it. Scraping may also raise terms-of-use questions for any commercial deployment.
- **A single lookup takes about 3 to 11 seconds** with AZCaptcha. The Tesseract fallback takes 10 to 50 seconds and is for offline development only.
- **Public lookups are rate-limited.** Each uncached lookup costs a captcha, so a connection gets 30 an hour by default. Cached results never count.
- **Sign-in is by email link or Google.** Phone OTP is not built. Email needs a [Resend](https://resend.com) key in production; locally the link is printed in the terminal.
- **Batch sizes are typed in by hand.** RGPV publishes no class sizes, so the density figures depend on an admin entering them.
- **Automated tests are unit tests.** They cover the enrollment parser, the academic calendar and GPA maths, the worker's parser, captcha client, session pool, API contract and result service. The interactive flows were checked by hand with a scripted browser, not in CI.

## How it works

```mermaid
flowchart LR
  STUDENT(("Student")) -->|email link or Google| WEB
  subgraph vercel ["Web app"]
    WEB["Next.js 15<br/>Server Components read, Server Actions write"]
  end
  subgraph data ["Data"]
    PG[("Postgres<br/>users, results, posts, listings")]
  end
  subgraph worker ["Result worker, Python"]
    API["FastAPI<br/>/api/v1/result"]
    POOL[("Redis<br/>pre-warmed portal sessions")]
  end
  CAPTCHA["AZCaptcha<br/>solves the image captcha"]
  RGPV[["result.rgpv.ac.in<br/>official portal"]]
  WEB <-->|Prisma| PG
  WEB -->|typed client, zod-checked reply| API
  API <--> POOL
  API -->|captcha image| CAPTCHA
  API -->|handshake, post form, parse HTML| RGPV
```

The web app reads from Postgres in Server Components and writes through Server Actions, which check the session, validate with Zod and revalidate the path. It talks to the worker through one client, `apps/web/src/lib/result-worker.ts`, which checks every reply against the shared `semesterResultSchema` before the UI sees it. The worker keeps a pool of warmed-up portal sessions in Redis, because the portal only accepts a form some seconds after the session was opened; a pooled session has already waited.

| Part | What it uses |
|---|---|
| Web app | [Next.js 15](https://nextjs.org) App Router, [React 19](https://react.dev), TypeScript strict, [Tailwind CSS 3](https://tailwindcss.com) with [shadcn/ui](https://ui.shadcn.com) and Radix |
| Signing in | [Auth.js v5](https://authjs.dev) with email links and Google, JWT sessions, and a small adapter over the project's own User table. An edge-safe config guards routes in middleware |
| Database | Postgres through [Prisma 5](https://www.prisma.io). Schema and seed in `packages/db` |
| Shared logic | `packages/shared`: the enrollment parser, branch codes, Zod schemas and domain types, with no React or Prisma in it |
| Result worker | Python 3.11, [FastAPI](https://fastapi.tiangolo.com), `requests`, Redis session pool, [AZCaptcha](https://azcaptcha.com) with Tesseract as a fallback, `slowapi` rate limit on the bulk endpoint |
| Monorepo | pnpm 9 workspaces and [Turborepo](https://turbo.build). The Python service is a workspace package whose scripts wrap pip, uvicorn, pytest, ruff and mypy |
| Checks | ESLint, Prettier, Vitest for TypeScript; Ruff, mypy, pytest for Python; both run in GitHub Actions on every push and pull request |
| Hosting | `vercel.json` builds the web app on [Vercel](https://vercel.com). The worker has a Dockerfile; the docs plan Fly.io for it |

## Run it on your machine

You need Node.js 20 or newer, pnpm 9, Python 3.11 or newer, Docker for Postgres and Redis, and an [AZCaptcha](https://azcaptcha.com) API key if you want real results. Tesseract is only needed if you set `CAPTCHA_PROVIDER=tesseract`.

```bash
git clone https://github.com/vishalmeena2211/rgpv-connect-platform.git && cd rgpv-connect-platform
```

```bash
pnpm install
```

```bash
docker compose -f infra/docker-compose.yml up -d postgres redis
```

```bash
cp packages/db/.env.example packages/db/.env && pnpm db:generate && pnpm db:migrate && pnpm db:seed
```

```bash
pnpm worker:setup
```

```bash
cp services/result-worker/.env.example services/result-worker/.env
```

Open `services/result-worker/.env` and set `AZCAPTCHA_API_KEY`. Then:

```bash
cp apps/web/.env.example apps/web/.env.local
```

```bash
pnpm dev
```

The web app is at http://localhost:3000 and the worker's API docs at http://localhost:8000/docs. The seed builds a demo world at UIT-RGPV: 38 verified CS 2028 students with four semesters each, two seniors, notes, papers, posts, jobs and listings. Sign in with any demo email; the sign-in link is printed in the terminal running `pnpm dev`:

| Email | Who |
|---|---|
| `priyanshi@rgpvconnect.dev` | A verified CS 2028 student with results, uploads and messages |
| `new.student@rgpvconnect.dev` | Signed in, not verified yet |
| `admin@rgpvconnect.dev` | Admin |

Set `ENABLED_FEATURES=network,campus` in `apps/web/.env.local` to open the feed, directory, groups, jobs and market for students. Every setting is listed in [`docs/configuration.md`](docs/configuration.md).

To call the worker directly:

```bash
curl -s -X POST http://localhost:8000/api/v1/result -H 'content-type: application/json' -d '{"enrollment":"0151CS21001","semester":1}'
```

Every setting, the worker's endpoints and the troubleshooting list are in [`docs/knowledge.md`](docs/knowledge.md).

## Repository layout

| Folder | What is in it |
|---|---|
| [`apps/web/`](apps/web) | The Next.js app. Feature folders under `src/features/*`, UI primitives under `src/components/ui`. See [`apps/web/README.md`](apps/web/README.md) |
| [`packages/shared/`](packages/shared) | Enrollment parser, branch codes, Zod schemas, domain types |
| [`packages/db/`](packages/db) | Prisma schema, migrations, client singleton and the seed |
| [`packages/config/`](packages/config) | Shared ESLint, TypeScript and Tailwind presets |
| [`services/result-worker/`](services/result-worker) | The FastAPI worker: session handshake, captcha, fetch, parse, Redis pool. See its [README](services/result-worker/README.md) |
| [`infra/`](infra) | `docker-compose.yml` for Postgres, Redis, the worker and the web app |
| [`docs/`](docs) | [Architecture](docs/architecture.md), the [portal and worker reference](docs/knowledge.md), the [strategy](docs/strategy.md) and the [free-tier launch guide](docs/launch-free.md) |

New here? Read [`docs/architecture.md`](docs/architecture.md) first, then [`docs/knowledge.md`](docs/knowledge.md) for how a result is actually fetched.

## Roadmap

- [x] Monorepo with web app, shared package, database package and Python worker
- [x] Enrollment verification by fetching a real result, with college, branch and batch decoded from the number
- [x] Enrollment parser accepts current 12-character numbers
- [x] Result lookup without an account, cached and rate-limited
- [x] My Results with trend, batch standing and an opt-in semester board
- [x] Share card for a result, with a WhatsApp link and an Open Graph image
- [x] Notes and papers upload with a review queue
- [x] Email magic-link sign-in
- [x] Installable app with offline My Results
- [x] Web Push, and a results-day fetch-and-notify run
- [x] Reporting and moderation for posts and listings
- [x] Privacy notice and a seven-day data-deletion request
- [x] Worker locked behind an API key, with health and captcha balance for admins
- [ ] Phone OTP sign-in
- [ ] Self-hosted, privacy-safe analytics
- [ ] Comments on posts in the redesigned feed
- [ ] Catalogue for branches other than CS
- [ ] Placement outcomes by branch and batch, published as a public good

## Contributing

**If you study at an RGPV college:** the most useful things are to try verifying with your own number and say what happened, and to contribute notes, papers or syllabus content.

**If you write code:** read [`CONTRIBUTING.md`](CONTRIBUTING.md) first. Reads go in Server Components, writes in Server Actions. Money is integer paise. A schema change ships with its migration. Run `pnpm lint && pnpm typecheck && pnpm test` before you push; CI runs the same. Keep the words plain: the app talks to students, not to developers.

Please do not add paywalls or paid integrations. By taking part you agree to the [Code of Conduct](CODE_OF_CONDUCT.md).

## Credits

RGPV Connect stands on other people's work:

- **Result data** comes from the official portal, [result.rgpv.ac.in](https://result.rgpv.ac.in/Result/BErslt.aspx), and belongs to RGPV.
- **Captcha solving** by [AZCaptcha](https://azcaptcha.com), with [Tesseract](https://github.com/tesseract-ocr/tesseract) as the offline fallback.
- Built with [Next.js](https://nextjs.org), [Prisma](https://www.prisma.io), [shadcn/ui](https://ui.shadcn.com), [Auth.js](https://authjs.dev), [FastAPI](https://fastapi.tiangolo.com) and [Turborepo](https://turbo.build).

## Licence

**[MIT](LICENSE)**, copyright 2026 RGPV Connect contributors. Use it, change it and share it, keeping the copyright notice. Result data is RGPV's and is not covered by this licence.

## Words used here

| Word | What it means |
|---|---|
| **Enrollment number** | The eleven-character student number RGPV issues, `CCCCBBYYNNN`. `0751BT16012` is college 0751, Biotechnology, admitted 2016, serial 012 |
| **Verified** | A profile whose enrollment number returned a real result from the portal, and whose college, branch and batch were decoded from it |
| **College code** | The first four digits of the number. `0151` is UIT-RGPV, the university's own institute |
| **Batch** | The graduating year, admission year plus four for a B.Tech |
| **SGPA, CGPA** | Semester and cumulative grade point averages on RGPV's 10-point scale |
| **Result worker** | The Python service that fetches a result from the portal: handshake, captcha, post, parse |
| **Session pool** | Portal sessions the worker opens ahead of time and keeps in Redis, so a lookup does not wait for the handshake and the portal's submit window |

<br>

<div align="center">
<sub>Made for RGPV students, by students. Not affiliated with or endorsed by Rajiv Gandhi Proudyogiki Vishwavidyalaya.</sub>
</div>
