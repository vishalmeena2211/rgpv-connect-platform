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

1. **Enums**: verification, roles, scopes, result, job, listing, report, dispute and deletion states
2. **Identity**: `User` (hybrid-identity fields, notification and board preferences), `Account` and `VerificationToken` for Auth.js, `College`, `Connection`
3. **Academic catalogue**: `Course → Year → Branch → Semester → Subject`, with credits
4. **Resources**: `Resource` (notes and papers, with review fields, downloads and file keys) and `ResourceRating`
5. **Results**: `ResultRecord` (a student's saved semesters), `ResultCache` (public lookups, six hours), `ShareCard`
6. **Network**: `Post`, `PostLike`, `Comment`, `Group` (auto-created college and batch groups by slug), `GroupMember`, `CohortSize`
7. **Marketplace**: `JobPost` (branches, batches, closing date), `MarketListing`
8. **Messages**: `Conversation`, `ConversationMember`, `Message`
9. **Notifications**: `Notification`, `PushSubscription`
10. **Trust and operations**: `Report`, `IdentityDispute`, `DeletionRequest`, `ResultsDeclaration`, `RateLimit`, `AuditLog`

## Commands

```bash
cp .env.example .env                  # DATABASE_URL, pointing at localhost

pnpm db:generate                      # regenerate the client (after schema edits)
pnpm db:migrate                       # create and apply a migration while developing
pnpm db:migrate:deploy                # apply existing migrations, no prompts
pnpm db:seed                          # load the demo world
```

The seed upserts four Bhopal colleges and the B.Tech CS catalogue for
semesters 1 to 8, then recreates a demo world at UIT-RGPV: 38 verified CS 2028
students with four semesters each, two seniors, notes and papers in review
states, posts, jobs, listings, a conversation and notifications. It deletes and
recreates only accounts with an `@rgpvconnect.dev` email, so it never touches
real users. Sign in locally as `priyanshi@rgpvconnect.dev`,
`new.student@rgpvconnect.dev` or `admin@rgpvconnect.dev`.

Keep `DATABASE_URL` on a local database when seeding.

## The subject catalogue

`prisma/catalogue/btech.json` holds RGPV's official B.Tech subject lists for
10 branches (CS, IT, EX, AL, CL, DS, CD, EC, ME, CE), semesters 1 to 8: code,
name and credits, read from RGPV's "Scheme of Examination" PDFs
(rgpv.ac.in → Scheme → B.Tech → Grading System). Each semester records the
PDF it came from, and its credits add up to that PDF's Total row.

- Elective slots (`CS603 Departmental Elective`, with credits) are followed by
  their options (`CS603(A) …`, no credits), since each option has its own paper.
- Non-credit courses, and internships whose credit RGPV counts in a later
  semester, have no credits.
- AL and CL share one scheme, as do DS and CD (RGPV prints them in one table).

```bash
pnpm --filter @rgpv/db catalogue:load            # preview: what would be added or changed
pnpm --filter @rgpv/db catalogue:load --apply    # write
```

It only adds and updates. A subject already in the database but missing from
the file is listed and left alone, so notes and papers attached to it stay.
