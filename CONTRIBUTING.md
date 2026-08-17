# Contributing to RGPV Connect

Thanks for your interest in improving RGPV Connect! It's a **free, open-source**
platform built by and for RGPV students, and contributions of every size are
welcome — code, docs, design, bug reports, and data (notes, papers, syllabus).

By participating, you agree to abide by our [Code of Conduct](CODE_OF_CONDUCT.md).

## Ways to contribute

- **Fix a bug or build a feature** — start from a `good first issue` if you're new.
- **Improve the docs** — the [`docs/`](docs/) folder and READMEs.
- **Report a bug** — open an issue with steps to reproduce.
- **Suggest a feature** — open an issue describing the problem it solves.
- **Contribute data** — seed notes, papers, or syllabus content.

For anything non-trivial, open an issue to discuss it **before** you start, so we
can agree on the approach and avoid wasted work.

## Local setup

You need **Node ≥ 20**, **pnpm 9**, and **Docker** (for Postgres + Redis).

```bash
# 1. Install JS dependencies
pnpm install

# 2. Start Postgres + Redis
docker compose -f infra/docker-compose.yml up -d postgres redis

# 3. Set up the database (seed creates a demo user — no real credentials needed)
cp packages/db/.env.example packages/db/.env
pnpm db:generate && pnpm db:migrate && pnpm db:seed

# 4. Run the web app
cp apps/web/.env.example apps/web/.env.local
pnpm dev
```

The app runs at http://localhost:3000. The seed gives you a working database and
a demo user, so you can develop the whole app **without any external accounts**
(Google OAuth, email, etc. are optional in dev).

The Python result-worker has its own setup — see
[services/result-worker/README.md](services/result-worker/README.md).

## Project layout

```
apps/web            Next.js 15 app (App Router, RSC, Server Actions)
packages/config     Shared ESLint / TS / Tailwind presets
packages/shared     Framework-agnostic domain logic (enrollment parser, types, zod)
packages/db         Prisma schema + client + seed
services/result-worker  FastAPI result fetcher (Python)
infra               docker-compose + Dockerfiles
docs                architecture + strategy
```

See [docs/architecture.md](docs/architecture.md) for how the pieces fit together.
Code is **feature-first**: domain logic lives under `apps/web/src/features/*`, and
shared UI primitives under `apps/web/src/components/ui`.

## Development workflow

1. **Fork** the repo and create a branch off `main`:
   `git checkout -b feat/short-description` (or `fix/…`, `docs/…`).
2. Make your change. Keep PRs focused — one logical change per PR.
3. Run the checks below and make sure they pass.
4. Commit with a clear message (see [Commit messages](#commit-messages)).
5. Push and open a **pull request** against `main`, filling in the PR template.

### Checks to run before you push

JavaScript / TypeScript (from the repo root):

```bash
pnpm lint         # ESLint across all workspaces
pnpm typecheck    # tsc --noEmit (strict)
pnpm test         # Vitest
pnpm format       # Prettier (or `pnpm format:check` to verify only)
```

Python worker (from `services/result-worker/`):

```bash
ruff check .
mypy app
pytest
```

CI runs these same checks on every PR, so running them locally saves a round-trip.

### Database changes

If you change [`packages/db/prisma/schema.prisma`](packages/db/prisma/schema.prisma),
generate a migration and commit it alongside the schema:

```bash
pnpm --filter @rgpv/db exec prisma migrate dev --name short_description
```

Never edit an already-committed migration; add a new one.

## Coding standards

- **TypeScript strict** everywhere (`noUncheckedIndexedAccess` included). No `any`
  without a good reason.
- **Server Components** read from Prisma directly; **Server Actions** own all
  mutations (authenticate, validate with Zod, then `revalidatePath`).
- **Money** is stored as integer minor units (paise). Dates are serialised to ISO
  strings at the query/Server-Action boundary.
- Match the style of the surrounding code. Prettier + ESLint are the source of
  truth — don't hand-format against them.
- This is a **free** platform: don't add paywalls, premium gating, or paid
  integrations. Features are for everyone.

## Commit messages

Use short, imperative subjects, optionally with a conventional prefix:

```
feat(results): add per-subject trend chart
fix(auth): handle expired verification token
docs(readme): clarify local setup
```

## Reporting security issues

Please **do not** open a public issue for security vulnerabilities. Instead,
report them privately to the maintainer (see [Code of Conduct](CODE_OF_CONDUCT.md)
for contact). We'll acknowledge and work on a fix before any public disclosure.

## Questions

Open a [Discussion](../../discussions) or a question issue. We're happy to help
new contributors get started.
