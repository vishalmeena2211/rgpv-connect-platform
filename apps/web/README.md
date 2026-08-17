# @rgpv/web

The RGPV Connect web app — Next.js 15 (App Router, React Server Components,
Server Actions), TypeScript strict, Tailwind + shadcn/ui, Auth.js v5, Prisma.

## Run

```bash
cp .env.example .env.local      # fill in AUTH_SECRET + Google OAuth creds
pnpm --filter @rgpv/web dev     # http://localhost:3000
```

Requires Postgres + Redis + the result worker — see the
[root README](../../README.md).

## Environment

| Variable                              | Purpose                                  |
| ------------------------------------- | ---------------------------------------- |
| `DATABASE_URL`                        | Postgres connection (shared with `@rgpv/db`) |
| `AUTH_SECRET`                         | Auth.js JWT secret (`openssl rand -base64 32`) |
| `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` | Google OAuth credentials               |
| `RESULT_WORKER_URL`                   | Base URL of the FastAPI result worker    |

## Layout

```
src/
├── app/
│   ├── (marketing)/     Public landing
│   ├── (auth)/          Login + enrollment onboarding
│   └── (app)/           Authed shell: feed, network, results, notes, papers,
│                        groups, jobs, market, premium, profiles (/u/[id])
├── features/            Feature-first modules (server actions, queries, components)
│   ├── auth/  results/  resources/  network/  groups/  marketplace/
├── components/
│   ├── ui/              shadcn primitives (button, card, badge, …)
│   └── shell/           Sidebar, bottom nav, top bar
├── config/nav.ts        Single source of navigation
├── lib/                 session, env, result-worker client, utils
├── auth.config.ts       Edge-safe Auth.js config (middleware guard)
└── auth.ts              Node Auth.js setup (Prisma upsert, JWT callbacks)
```

## Conventions

- **Reads** happen in Server Components straight from Prisma; **writes** go
  through Server Actions in `features/*/<name>-actions.ts`.
- Server Actions authenticate via `lib/session.ts#getCurrentUser`, enforce
  verification/role, validate with Zod, then `revalidatePath`.
- Client Components stay thin: forms, optimistic toggles, URL-driven filters.
- Dates are serialised to ISO strings and money to integer paise at the
  query/action boundary, so Client Components receive plain JSON.

## Scripts

```bash
pnpm --filter @rgpv/web dev        # dev server
pnpm --filter @rgpv/web build      # production (standalone) build
pnpm --filter @rgpv/web typecheck  # tsc --noEmit
pnpm --filter @rgpv/web lint       # eslint
```
