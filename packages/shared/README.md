# @rgpv/shared

Framework-agnostic domain logic shared between the web app and (conceptually
mirrored in) the Python worker. No React, no Prisma, no Node-only APIs — just
pure TypeScript so it can run anywhere.

## Exports

| Entry point            | Contents                                                |
| ---------------------- | ------------------------------------------------------- |
| `@rgpv/shared`         | Re-exports everything below                             |
| `@rgpv/shared/enrollment` | Enrollment-number parser + branch codes              |
| `@rgpv/shared/types`   | Domain enums + result types                             |
| `@rgpv/shared/schemas` | Zod schemas for requests and parsed results             |

## Enrollment numbers

RGPV enrollment numbers follow `CCCCBBYYNNN`:

| Segment | Example | Meaning                          |
| ------- | ------- | -------------------------------- |
| `CCCC`  | `0751`  | College code                     |
| `BB`    | `CS`    | Branch code                      |
| `YY`    | `21`    | Admission year (2-digit)         |
| `NNN`   | `001`   | Serial within the branch + batch |

`parseEnrollment()` decodes these into college/branch/batch — the basis for the
hybrid identity model's auto-grouping. The same logic is mirrored in the
worker's `core/enrollment.py` so both sides agree.

## Test

```bash
pnpm --filter @rgpv/shared test       # vitest
pnpm --filter @rgpv/shared typecheck
```

> Keep the domain enums here in sync with the Prisma enums in `@rgpv/db` and the
> mirrored Python logic in the worker.
