# RGPV Connect

> A **free, open-source** verified student network and utility platform for
> **RGPV University, Bhopal** — built by students, for students.

RGPV Connect started as a utility site (exam results, notes, previous-year papers,
syllabus). This monorepo is the **community rewrite**: the utilities are the hook,
and a verified, college-grouped student network sits on top — with an opportunities
and campus layer (jobs/internships, buy-sell) for the community.

There is no paid tier, no premium gate, and no ads. Everything is free, and
**anyone can contribute** — see [Contributing](#contributing).

## Monorepo layout

```
rgpv-connect-platform/
├── apps/
│   └── web/                 Next.js 15 web app (App Router, RSC, Server Actions)
├── packages/
│   ├── config/              Shared ESLint / TypeScript / Tailwind presets
│   ├── shared/              Framework-agnostic domain logic (enrollment parser, types, zod schemas)
│   └── db/                  Prisma schema + client + seed
├── services/
│   └── result-worker/       FastAPI service that fetches RGPV results (merges 3 legacy workers)
├── infra/                   docker-compose, Dockerfiles
└── docs/                    Architecture and product docs
```

## Architecture

Three product layers, built in phases:

1. **Utility** — result lookup, "My Results" auto-sync, SGPA calculator, notes, papers.
2. **Network** — verified profiles auto-grouped by college/branch/batch, feed, directory, follows, groups. _(DMs + notifications planned.)_
3. **Opportunities & Campus** — jobs/internships board, campus buy-sell marketplace — all free. _(Events planned.)_

Identity is **hybrid**: Google / phone-OTP login + mandatory enrollment-number
verification (which auto-groups the student), with an optional college-email badge.

See [docs/architecture.md](docs/architecture.md) for the full design.

## Getting started

```bash
# 1. Install JS dependencies
pnpm install

# 2. Start Postgres + Redis (and optionally the worker)
docker compose -f infra/docker-compose.yml up -d postgres redis

# 3. Set up the database
cp packages/db/.env.example packages/db/.env
pnpm db:generate && pnpm db:migrate && pnpm db:seed

# 4. Run the web app
cp apps/web/.env.example apps/web/.env.local
pnpm dev
```

The seed script gives you a working database with a demo user, so you can run the
whole app locally without any real credentials or external services.

The Python worker has its own setup — see
[services/result-worker/README.md](services/result-worker/README.md).

## Contributing

RGPV Connect is community-built and welcomes contributions of every size —
code, docs, bug reports, design, and data (notes, papers, syllabus).

- **Good first issues:** anything labelled `good first issue` in the tracker.
- **Local setup:** follow [Getting started](#getting-started) above — no external
  accounts needed to run the app.
- **Roadmap & priorities:** see [docs/strategy.md](docs/strategy.md).
- **How it fits together:** see [docs/architecture.md](docs/architecture.md).

Open an issue to discuss anything non-trivial before you start, then send a PR.
See [CONTRIBUTING.md](CONTRIBUTING.md) for setup, workflow, and coding standards,
and [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md) for community expectations.

## License

RGPV Connect is released under the [MIT License](LICENSE) — free to use, modify,
and redistribute with attribution.

## Tooling

- **Package manager:** pnpm workspaces + Turborepo
- **Web:** Next.js 15, React 19, TypeScript (strict), Tailwind, shadcn/ui, Auth.js v5, Prisma
- **Worker:** Python 3.11, FastAPI, Redis, Tesseract OCR
- **Quality:** strict TS everywhere, ESLint, Prettier, Vitest / Pytest
