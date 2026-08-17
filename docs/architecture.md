# RGPV Connect — Architecture

This document explains how the platform is structured, why the major decisions
were made, and how the pieces fit together. For setup, see the root
[README](../README.md).

## 1. Product thesis

RGPV Connect began as a utility site (results, notes, papers, syllabus). The
rewrite keeps those utilities as the **entry point** and layers a verified,
college-grouped **student network** on top, then an **opportunities & campus**
layer. It is a free, open-source, community-built project — there is no paid
tier. Three layers, built in order:

| Layer                     | Surface                                                  | Role                |
| ------------------------- | ------------------------------------------------------- | ------------------- |
| **Utility**               | Result lookup, My Results, SGPA calculator, notes, papers | Entry point       |
| **Network**               | Feed, directory, profiles, follows, groups              | Retention / community |
| **Opportunities & Campus**| Jobs/internships, campus buy-sell                       | Community utility   |

## 2. Identity: the hybrid model

Most RGPV-affiliated colleges do **not** issue institutional email, so
college-email login alone can't group students. Instead:

- Users authenticate with **Google** (phone-OTP is stubbed for later).
- They must **verify an enrollment number**, which we confirm by fetching a real
  result from the worker.
- The enrollment number `CCCCBBYYNNN` is **decoded** (`@rgpv/shared`) into
  college code, branch, and admission year — these auto-populate the grouping
  fields. Students never type their college/branch manually.
- An optional **college-email badge** can be added on top.

This means every network edge is anchored to a verified, real student, and
college/branch/batch grouping is derived rather than self-reported.

## 3. Monorepo topology

```
apps/web            Next.js 15 app (App Router, RSC, Server Actions)
packages/config     Shared ESLint / TS / Tailwind presets
packages/shared     Framework-agnostic domain logic (enrollment parser, types, zod)
packages/db         Prisma schema + client singleton + seed
services/result-worker  FastAPI scraper (merges 3 legacy Python repos)
infra               docker-compose + Dockerfiles
docs                this
```

pnpm workspaces + Turborepo orchestrate JS builds; the Python service is
intentionally **outside** the workspace and deployed independently.

## 4. The result worker

The legacy project had three overlapping Python repos (a bulk fetcher, a session
supplier, and a single-result fetcher). They are merged into one FastAPI service
with a shared `core/`:

- **`core/session`** performs the ASP.NET WebForms handshake (`__VIEWSTATE`,
  `__EVENTVALIDATION`).
- **`core/captcha`** solves the 5-character image captcha with Tesseract OCR.
- **`core/fetch` + `core/parser`** POST the result form and parse the HTML.
- **`services/session_pool`** keeps a Redis-backed pool of warm sessions so the
  captcha/handshake cost is amortised across requests.
- Routers expose `/single`, `/bulk` (rate-limited), `/queue`, and `/health`.

The TS `enrollment` parser is mirrored in Python (`core/enrollment`) so both
sides decode enrollment numbers identically.

## 5. Web app data flow

- **Server Components** read directly from Prisma (`@rgpv/db`) for all
  list/detail screens — no API layer in between.
- **Server Actions** own every mutation (post, follow, join, list item, sync
  results). They authenticate via `getCurrentUser()` (`lib/session.ts`, memoised
  per request with React `cache`), enforce verification/role, validate with Zod,
  then `revalidatePath`.
- **Client Components** are thin: forms, optimistic toggles (likes, follows,
  joins), and URL-driven filters. They call Server Actions and surface results
  as toasts.
- The web app talks to the worker through one typed client
  (`lib/result-worker.ts`), which validates worker output against the shared
  `semesterResultSchema` before it reaches the UI.

### Auth.js v5 split

`auth.config.ts` is **edge-safe** (providers + the `authorized` route guard) and
powers the middleware. `auth.ts` adds the Node-only bits (Prisma upsert on
sign-in, JWT/session callbacks). Session strategy is **JWT**: we own the `User`
table, so the token mirrors our DB id + verification status and the middleware
guards routes without a DB round-trip.

## 6. Data model highlights

- **User** carries the hybrid-identity fields; grouping columns are indexed for
  directory queries.
- **College** is keyed by the 4-digit enrollment college code.
- The **academic catalogue** is a `Course → Year → Branch → Semester → Subject`
  tree that `Resource` (notes/papers) hangs off.
- **ResultRecord** caches the full parsed result as `payload` JSON plus
  denormalised `sgpa`/`cgpa` for analytics.
- **Opportunities & Campus** adds `JobPost` and `MarketListing` (prices stored as
  integer paise to avoid float drift), scoped to a college. Listings are free —
  there is no take-rate or payment integration.

## 7. Conventions

- TypeScript strict everywhere (`noUncheckedIndexedAccess`).
- Feature-first folders under `src/features/*`; UI primitives under
  `src/components/ui` (shadcn pattern, CSS-variable tokens, light/dark).
- Money as integer minor units; dates serialised to ISO strings at the
  query/Server-Action boundary so Client Components receive plain JSON.
