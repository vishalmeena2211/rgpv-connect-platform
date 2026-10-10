# @rgpv/web

The RGPV Connect web app: Next.js 15 (App Router, Server Components, Server
Actions), React 19, TypeScript strict, Tailwind on theme tokens, Auth.js v5
(email link and Google), Prisma.

## Run

From the repository root, follow [Run it on your machine](../../README.md#run-it-on-your-machine).
To run only the web app:

```bash
pnpm --filter @rgpv/web dev
```

It needs Postgres, and the result worker for live lookups. Every setting is in
[`docs/configuration.md`](../../docs/configuration.md). Without `RESEND_API_KEY`,
the sign-in link is printed in this terminal.

## Layout

```
src/
├── app/
│   ├── (marketing)/   Public: landing with the lookup, /result/[enrollment],
│   │                  /s/[token] share pages, how it works, privacy, terms
│   ├── (auth)/        Sign in, check your email, verification
│   ├── (app)/         Signed-in shell: results, notes, papers, uploads,
│   │                  messages, notifications, settings, profiles, search,
│   │                  welcome, the after-launch feed/network/groups/jobs/market,
│   │                  and admin (review, results day, worker, privacy, students)
│   ├── api/           Auth.js, share-card images, file storage, downloads,
│   │                  job apply clicks, the results-day cron, health
│   ├── manifest.ts    Installable app manifest
│   └── icons/         App icons rendered on demand
├── features/          Feature modules: queries, server actions and components
│   ├── results/  auth/  resources/  messages/  notifications/  settings/
│   ├── network/  groups/  marketplace/  admin/  push/  pwa/
├── components/
│   ├── ui/            Primitives: button, card, badge, segmented, chip, callout,
│   │                  stat tile, dialog, empty state, inputs
│   └── shell/         Top bar, sidebar, phone tab bar, public header and footer
├── config/nav.ts      Navigation, including the after-launch section
├── lib/               env, session, auth adapter, email, result-worker client,
│                      storage, push, rate limit, audit log, feature switches
├── auth.config.ts     Edge-safe Auth.js config: public paths and the route guard
└── auth.ts            Node Auth.js setup: providers, adapter, JWT callbacks
public/sw.js           Service worker: offline My results and push notifications
```

## Conventions

- **Reads** happen in Server Components straight from Prisma; **writes** go
  through Server Actions in `features/*/actions.ts`.
- Server Actions check the session with `lib/session.ts`, enforce verification
  or role, validate with Zod, then `revalidatePath`. Admin actions also write
  to the audit log.
- Every result lookup goes through `features/results/service.ts`: cache first,
  rate limit on a miss, then the worker.
- Client Components stay thin: forms, optimistic toggles, URL-driven filters.
- Dates become ISO strings and money integer paise at the query or action
  boundary, so Client Components receive plain JSON.
- Colours come from the tokens in `app/globals.css`, so light and dark stay in
  step. Copy is written from the student's side: no status codes or jargon.

## Scripts

```bash
pnpm --filter @rgpv/web dev        # dev server on :3000
pnpm --filter @rgpv/web build      # production build
pnpm --filter @rgpv/web typecheck  # tsc --noEmit
pnpm --filter @rgpv/web lint       # eslint
```
