# Security Policy

RGPV Connect handles student personal data (names, enrollment numbers, results),
so we take security seriously and appreciate responsible disclosure.

## Reporting a vulnerability

**Please do not open a public issue for security vulnerabilities.**

Instead, report privately via either:

- **GitHub Security Advisories** — [open a private report](https://github.com/vishalmeena2211/rgpv-connect-platform/security/advisories/new) (preferred), or
- **Email** — hotelcityzen5@gmail.com with the subject `SECURITY: <short summary>`.

Please include:

- A description of the issue and its impact
- Steps to reproduce (proof-of-concept if possible)
- Affected area: web app, result-worker, database, or infra
- Any suggested remediation

## What to expect

- **Acknowledgement** within a few days.
- We'll investigate, confirm, and work on a fix before any public disclosure.
- We'll credit you in the advisory once the fix ships, unless you prefer to stay anonymous.

## Scope

In scope: the web app (`apps/web`), the result-worker (`services/result-worker`),
shared packages, database schema, and deployment/infra configuration in this repo.

Out of scope: vulnerabilities in third-party services (Vercel, Neon, RGPV's own
portal) — please report those to the respective vendors.

## Handling of student data

- Auth uses JWT sessions; we own the `User` table and never store third-party
  passwords.
- Result data is cached from RGPV's public result portal and belongs to RGPV.
- Data-deletion and DPDP-compliance work is tracked on the project roadmap. If you
  need your data removed, contact the maintainer at the email above.
