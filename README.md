<div align="center">

<img src=".github/readme/banner.png" alt="RGPV Connect: your RGPV result in ten seconds, then your whole batch. A verified result card shows SGPA 8.41 and CGPA 7.95 for an example student in CS 2028 at UIT-RGPV" width="100%">

<br>

**Exam results, notes and papers, and a campus network for RGPV University, Bhopal.<br>Every profile is tied to a real enrollment number, proved by fetching that student's own result.**

<br>

[![Next.js 15](https://img.shields.io/badge/Next.js-15-0F2A24?logo=nextdotjs&logoColor=white)](https://nextjs.org)
[![React 19](https://img.shields.io/badge/React-19-0F2A24?logo=react&logoColor=61dafb)](https://react.dev)
[![TypeScript strict](https://img.shields.io/badge/TypeScript-strict-0F8A6F?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Tailwind CSS 3](https://img.shields.io/badge/Tailwind_CSS-3-0F8A6F?logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![Postgres with Prisma 5](https://img.shields.io/badge/Postgres-Prisma_5-0F8A6F?logo=postgresql&logoColor=white)](https://www.prisma.io)
[![Auth.js v5](https://img.shields.io/badge/Auth.js-email_link,_Google-0F8A6F)](https://authjs.dev)
[![FastAPI worker](https://img.shields.io/badge/FastAPI-Python_3.11-0F2A24?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![pnpm and Turborepo](https://img.shields.io/badge/pnpm_9-Turborepo-0F2A24?logo=pnpm&logoColor=white)](https://turbo.build)
<br>
[![Status: early](https://img.shields.io/badge/status-early,_no_students_on_it_yet-0F8A6F)](#how-far-to-trust-it)
[![Installable](https://img.shields.io/badge/installable-offline_results,_push-0F8A6F)](#what-it-does)
[![Free](https://img.shields.io/badge/free-no_paid_tier,_no_ads-0F8A6F)](#the-rules-it-keeps)
[![Licence: MIT](https://img.shields.io/badge/licence-MIT-0F2A24)](#licence)

[What it does](#what-it-does) · [Screens](#screens) · [The rules it keeps](#the-rules-it-keeps) · [How far to trust it](#how-far-to-trust-it) · [How it works](#how-it-works) · [Run it yourself](#run-it-on-your-machine) · [Docs](docs)

</div>

<br>

<p align="center">
  <img src=".github/readme/screens.png" alt="My results on a laptop: CGPA 7.95, latest SGPA 8.41, a semester-by-semester trend chart and the list of semesters. Two phones beside it show a result with its subject table, and the share card sheet with a Share to WhatsApp button" width="100%">
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

## Screens

All screens below are the real app running on the seeded demo data, at UIT-RGPV in October 2026. Names and grades are examples.

| | |
|---|---|
| <img src="docs/screenshots/landing.png" alt="Landing page: the headline, a live result lookup card and three feature cards"> | <img src="docs/screenshots/result.png" alt="A public result: SGPA 8.41 in a dark tile, CGPA, credits and the subject table with grades and points"> |
| **Check a result, no account.** The lookup is on the landing page and decodes the number as you type. | **The result.** SGPA, CGPA, credits and every subject, fetched live or from the six-hour cache. |
| <img src="docs/screenshots/verify.png" alt="Verification: Is this you? with the name RGPV holds, college, branch, batch and semester 4 SGPA, and Not me and Yes buttons"> | <img src="docs/screenshots/my-results.png" alt="My results: four headline tiles, a trend chart and the list of semesters with a not-declared semester 5"> |
| **Verify once.** The name comes from RGPV; college, branch and batch from the number. | **My results.** Every semester, the CGPA trend, where you stand in your batch, and when the next result is due. |
| <img src="docs/screenshots/share-card.png" alt="Share dialog with a dark result card, options for what is on it, and Share to WhatsApp, Save image and Copy link buttons"> | <img src="docs/screenshots/calculator.png" alt="SGPA calculator pre-filled with semester 5 subjects and a target saying an average SGPA of 8.86 is needed"> |
| **Share card.** A verified card for the batch group. The link holds a token, never the enrollment number. | **Plan next semester.** What-if grades on the real syllabus, and the average needed for a target CGPA. |
| <img src="docs/screenshots/not-declared.png" alt="Semester 5 is not declared yet, with when the exams are and when the result usually appears"> | <img src="docs/screenshots/notes.png" alt="Notes for CS semester 5, filtered by subject, with ratings, downloads and who shared them"> |
| **Not out yet.** Says when the result usually appears, instead of an error. | **Notes and papers.** By branch, semester and subject, shared by verified students and reviewed. |
| <img src="docs/screenshots/admin-results-day.png" alt="Admin results day: five sample numbers checked against the portal, 38 students in the batch, and a Fetch and notify button"> | <img src="docs/screenshots/my-results-dark.png" alt="My results in dark mode"> |
| **Results day.** Check five sample numbers, then fetch the batch and notify everyone. | **Dark mode.** Every screen follows the system setting. |

<p align="center">
  <img src="docs/screenshots/phone-landing.png" alt="Landing page on a phone" width="22%">
  <img src="docs/screenshots/phone-my-results.png" alt="My results on a phone with the bottom tab bar" width="22%">
  <img src="docs/screenshots/phone-result.png" alt="A result on a phone" width="22%">
  <img src="docs/screenshots/phone-share.png" alt="The share sheet on a phone" width="22%">
</p>

More: [review queue](docs/screenshots/admin-review.png), [result worker health](docs/screenshots/admin-worker.png), [my uploads](docs/screenshots/uploads.png). The screens were planned first as [wireframes](docs/wireframes/rgpv-connect-wireframes.html) (download and open in a browser).

## The rules it keeps

- **Every verified profile is backed by a fetched result.** Typing a number is not enough. The worker must return that student's result from RGPV.
- **College, branch and batch are derived, never self-reported.** They come from the enrollment number, parsed on the server by `@rgpv/shared` and mirrored in Python in the worker, so both sides decode the same way.
- **It is free, and stays free.** No paid tier, no commission, no ads. The last premium code path was removed in the migration `remove_premium_tier`. Contributions that add paywalls are declined in [`CONTRIBUTING.md`](CONTRIBUTING.md).
- **The result fetcher is best effort.** Every caller must degrade cleanly when the worker is down or the portal rejects a request.
- **Grades are private.** Other students see a name, college, branch and batch. Grades show only on a card the student shares, or on the opt-in semester board. Batch standing is shown only for groups of 20 or more.
- **Share links never carry an enrollment number.** A card is a random token; anonymous cards hide the serial.
- **Secrets stay out of the browser.** The captcha solver key lives only in the worker, and the worker refuses any caller without the shared `WORKER_API_KEY`.
- **Student data is treated as personal data.** A student can ask for deletion from Settings; after seven days everything goes, and the request stays in the audit log without details. Report a vulnerability privately, as [`SECURITY.md`](SECURITY.md) asks. India's DPDP Act applies.
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
    PG[("Postgres<br/>users, results, result cache, audit log")]
    FILES[("R2 or local disk<br/>notes and papers")]
  end
  subgraph worker ["Result worker, Python"]
    API["FastAPI<br/>/api/v1/result, /stats"]
    POOL[("Redis<br/>warm portal sessions, metrics")]
  end
  MAIL["Resend<br/>sign-in emails"]
  PUSH["Web Push<br/>results-day alerts"]
  CAPTCHA["AZCaptcha<br/>solves the image captcha"]
  RGPV[["result.rgpv.ac.in<br/>official portal"]]
  WEB <-->|Prisma| PG
  STUDENT -->|signed upload| FILES
  WEB -->|X-Worker-Key, zod-checked reply| API
  WEB --> MAIL
  WEB --> PUSH
  API <--> POOL
  API -->|captcha image| CAPTCHA
  API -->|handshake, post form, parse HTML| RGPV
```

The web app reads from Postgres in Server Components and writes through Server Actions, which check the session, validate with Zod and revalidate the path. Every lookup checks the Postgres result cache first; only a miss reaches the worker, through one client, `apps/web/src/lib/result-worker.ts`, which sends the shared key and checks every reply against `semesterResultSchema`. Uploads go from the browser straight to storage with a ten-minute signed URL. The worker keeps a pool of warmed-up portal sessions in Redis, because the portal only accepts a form some seconds after the session was opened; a pooled session has already waited.

| Part | What it uses |
|---|---|
| Web app | [Next.js 15](https://nextjs.org) App Router, [React 19](https://react.dev), TypeScript strict, [Tailwind CSS 3](https://tailwindcss.com) on theme tokens for light and dark, [Radix](https://www.radix-ui.com) primitives, [lucide](https://lucide.dev) icons, Plus Jakarta Sans and DM Sans |
| App shell | Installable: web manifest, a service worker that keeps My results for offline use, and [Web Push](https://github.com/web-push-libs/web-push) for results day and messages |
| Signing in | [Auth.js v5](https://authjs.dev) with email links and Google, JWT sessions, and a small adapter over the project's own User table. An edge-safe config guards routes in middleware |
| Database | Postgres through [Prisma 5](https://www.prisma.io). Schema, migrations and the demo seed in `packages/db`. Rate limits and the result cache live in Postgres too, so serverless instances share them |
| Files | Notes and papers on any S3-compatible bucket, [Cloudflare R2](https://developers.cloudflare.com/r2/) in the launch plan, or local disk in development |
| Shared logic | `packages/shared`: the enrollment parser, the academic calendar (which semester is out when), GPA maths, batch percentile, Zod schemas and domain types, with no React or Prisma in it |
| Result worker | Python 3.11, [FastAPI](https://fastapi.tiangolo.com), `requests`, Redis session pool and fetch metrics, [AZCaptcha](https://azcaptcha.com) with Tesseract as a fallback, a shared-key guard, `slowapi` rate limit on the bulk endpoint |
| Monorepo | pnpm 9 workspaces and [Turborepo](https://turbo.build). The Python service is a workspace package whose scripts wrap pip, uvicorn, pytest, ruff and mypy |
| Checks | ESLint, Prettier, Vitest for TypeScript; Ruff, mypy, pytest for Python; both run in GitHub Actions on every push and pull request |
| Hosting | `vercel.json` builds the web app on [Vercel](https://vercel.com). The worker has a Dockerfile; the docs plan Fly.io for it |

## Run it on your machine

You need Node.js 20 or newer, pnpm 9, Python 3.11 or newer, Docker for Postgres and Redis, and an [AZCaptcha](https://azcaptcha.com) API key if you want real results. Tesseract is only needed if you set `CAPTCHA_PROVIDER=tesseract`.

### Once

```bash
git clone https://github.com/vishalmeena2211/rgpv-connect-platform.git && cd rgpv-connect-platform
```

```bash
pnpm install && pnpm worker:setup
```

```bash
cp packages/db/.env.example packages/db/.env && cp apps/web/.env.example apps/web/.env.local && cp services/result-worker/.env.example services/result-worker/.env
```

Open `services/result-worker/.env` and set `AZCAPTCHA_API_KEY`. Without it, lookups fall back to slow local OCR or fail, and the app shows "RGPV's portal is not answering".

### Every time

One command starts Docker, waits for Postgres and Redis, applies migrations, loads the demo data and runs the web app and the worker together:

```bash
open -a Docker && until docker info >/dev/null 2>&1; do sleep 2; done && docker compose -f infra/docker-compose.yml up -d --wait postgres redis && pnpm db:migrate:deploy && pnpm db:seed && pnpm dev
```

`open -a Docker` is for macOS; on Linux start Docker your usual way and drop that part.

> [!WARNING]
> `db:migrate:deploy` and `db:seed` write to whatever `DATABASE_URL` says in `packages/db/.env`. Keep it pointing at `localhost`. The seed only recreates `@rgpvconnect.dev` accounts, but it has no business on a real database.

The web app is at http://localhost:3000 and the worker's API docs at http://localhost:8000/docs. The seed builds a demo world at UIT-RGPV: 38 verified CS 2028 students with four semesters each, two seniors, notes, papers, posts, jobs and listings. Sign in with any demo email; the sign-in link is printed in the terminal running `pnpm dev`:

| Email | Who |
|---|---|
| `priyanshi@rgpvconnect.dev` | A verified CS 2028 student with results, uploads and messages |
| `new.student@rgpvconnect.dev` | Signed in, not verified yet |
| `admin@rgpvconnect.dev` | Admin |

Set `ENABLED_FEATURES=network,campus` in `apps/web/.env.local` to open the feed, directory, groups, jobs and market for students. Every setting is listed in [`docs/configuration.md`](docs/configuration.md).

### If Postgres is already installed on your machine

A Postgres installed with Homebrew or an installer usually listens on `localhost:5432` too, and answers before the Docker one. Migrations then fail with `P1010: User rgpv was denied access`. Check with:

```bash
lsof -nP -iTCP:5432 -sTCP:LISTEN
```

If you see a `postgres` process as well as Docker, either stop it while you work (`brew services stop postgresql@16`), or use it instead of Docker by giving it the same user and database:

```bash
psql -h 127.0.0.1 -d postgres -c "create role rgpv with login password 'rgpv'" -c "create database rgpv_connect owner rgpv"
```

Then run the start command without the Docker Postgres:

```bash
docker compose -f infra/docker-compose.yml up -d --wait redis && pnpm db:migrate:deploy && pnpm db:seed && pnpm dev
```

To remove that database later: `psql -h 127.0.0.1 -d postgres -c "drop database rgpv_connect" -c "drop role rgpv"`.

### Calling the worker directly

```bash
curl -s -X POST http://localhost:8000/api/v1/result -H 'content-type: application/json' -H "x-worker-key: $WORKER_API_KEY" -d '{"enrollment":"0198CS231019","semester":4}'
```

The key header is only needed once `WORKER_API_KEY` is set. The worker's endpoints and the troubleshooting list are in [`docs/knowledge.md`](docs/knowledge.md).

## Repository layout

| Folder | What is in it |
|---|---|
| [`apps/web/`](apps/web) | The Next.js app. Feature folders under `src/features/*` (results, auth, resources, admin, network, marketplace and more), UI primitives under `src/components/ui`. See [`apps/web/README.md`](apps/web/README.md) |
| [`packages/shared/`](packages/shared) | Enrollment parser, branch codes, Zod schemas, domain types |
| [`packages/db/`](packages/db) | Prisma schema, migrations, client singleton and the seed |
| [`packages/config/`](packages/config) | Shared ESLint, TypeScript and Tailwind presets |
| [`services/result-worker/`](services/result-worker) | The FastAPI worker: session handshake, captcha, fetch, parse, Redis pool. See its [README](services/result-worker/README.md) |
| [`infra/`](infra) | `docker-compose.yml` for Postgres, Redis, the worker and the web app |
| [`docs/`](docs) | [Every setting](docs/configuration.md), [architecture](docs/architecture.md), the [portal and worker reference](docs/knowledge.md), the [strategy](docs/strategy.md), the [free-tier launch guide](docs/launch-free.md), the [wireframes](docs/wireframes) and the [screenshots](docs/screenshots) |
| [`.github/readme/`](.github/readme) | The banner and screens images, and the HTML they are rendered from |

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
- Built with [Next.js](https://nextjs.org), [Prisma](https://www.prisma.io), [Auth.js](https://authjs.dev), [Radix](https://www.radix-ui.com), [lucide](https://lucide.dev), [web-push](https://github.com/web-push-libs/web-push), [FastAPI](https://fastapi.tiangolo.com) and [Turborepo](https://turbo.build). Sign-in emails through [Resend](https://resend.com).
- Type: [Plus Jakarta Sans](https://fonts.google.com/specimen/Plus+Jakarta+Sans) and [DM Sans](https://fonts.google.com/specimen/DM+Sans), both under the SIL Open Font Licence.

## Licence

**[MIT](LICENSE)**, copyright 2026 RGPV Connect contributors. Use it, change it and share it, keeping the copyright notice. Result data is RGPV's and is not covered by this licence.

## Words used here

| Word | What it means |
|---|---|
| **Enrollment number** | The twelve-character student number RGPV issues, `CCCCBBYYNNNN`. `0198CS231019` is college 0198, Computer Science, admitted 2023, serial 1019. Older numbers have a three-digit serial, and both are accepted |
| **Verified** | A profile whose enrollment number returned a real result from the portal, and whose college, branch and batch were decoded from it |
| **College code** | The first four digits of the number. `0151` is UIT-RGPV, the university's own institute |
| **Batch** | The graduating year, admission year plus four for a B.Tech |
| **SGPA, CGPA** | Semester and cumulative grade point averages on RGPV's 10-point scale |
| **Result worker** | The Python service that fetches a result from the portal: handshake, captcha, post, parse |
| **Share card** | An image of one semester's SGPA and CGPA, with the student's name if they verified, behind a random link |
| **Results day** | The day RGPV declares a semester. An admin checks five sample numbers, then the app fetches the semester for the whole batch and notifies everyone |
| **Density** | The share of a batch that is verified. The feed, directory and campus sections open at about a third |
| **Session pool** | Portal sessions the worker opens ahead of time and keeps in Redis, so a lookup does not wait for the handshake and the portal's submit window |

<br>

<div align="center">
<sub>Made for RGPV students, by students. Not affiliated with or endorsed by Rajiv Gandhi Proudyogiki Vishwavidyalaya.</sub>
</div>
