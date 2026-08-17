# @rgpv/db

Prisma schema, generated client singleton, and seed data for RGPV Connect.
PostgreSQL is the datastore.

## Usage

```ts
import { prisma } from '@rgpv/db';

const user = await prisma.user.findUnique({ where: { id } });
```

`src/index.ts` exports a single `prisma` instance (reused across hot reloads in
dev) and re-exports all generated Prisma types/enums, so consumers import both
the client and types from one place.

## Schema overview

Organised top-down by product layer:

1. **Enums** — verification, roles, scopes, result/job/listing states
2. **Identity** — `User` (hybrid-identity fields), `College`, `Connection`
3. **Academic catalogue** — `Course → Year → Branch → Semester → Subject`
4. **Resources** — `Resource` (notes/papers) + `ResourceRating`
5. **Results** — `ResultRecord` (cached parsed result + denormalised SGPA/CGPA)
6. **Network** — `Post`, `Comment`, `Group`, `GroupMember`
7. **Marketplace** — `JobPost`, `MarketListing`

## Commands

```bash
cp .env.example .env                  # DATABASE_URL

pnpm db:generate                      # regenerate the client (after schema edits)
pnpm db:migrate                       # create/apply a dev migration
pnpm db:seed                          # seed colleges, B.Tech catalogue, demo user
```

The seed inserts four Bhopal colleges, a B.Tech catalogue, and a demo verified
user (`0151CS21001`) for local development.
