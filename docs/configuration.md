# Configuration

Every setting RGPV Connect reads, where it goes, and what happens without it.
Only `DATABASE_URL` and `AUTH_SECRET` are required; everything else has a safe
default or switches a feature off cleanly.

> The `.env.example` files predate these settings. Copy the lines below into
> `apps/web/.env.local` and `services/result-worker/.env` as needed.

## Web app (`apps/web/.env.local`, or Vercel project settings)

### Required

| Variable | Example | Purpose |
| --- | --- | --- |
| `DATABASE_URL` | `postgresql://rgpv:rgpv@localhost:5432/rgpv_connect?schema=public` | Postgres. Same value as `packages/db/.env`. |
| `AUTH_SECRET` | output of `openssl rand -base64 32` | Signs session tokens and local upload links. |

### Sign-in

| Variable | Default | Purpose |
| --- | --- | --- |
| `RESEND_API_KEY` | empty | Sends email sign-in links through [Resend](https://resend.com). **Without it, in development the link is printed in the dev server’s terminal**; in production sign-in by email fails with a clear error. |
| `EMAIL_FROM` | `RGPV Connect <login@rgpvconnect.in>` | Sender address. Must be a domain verified in Resend. |
| `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET` | empty | Enables “Continue with Google”. Without them the button shows disabled with a reason. Redirect URI: `<APP_URL>/api/auth/callback/google`. |
| `AUTH_URL` | detected | Public origin for Auth.js callbacks when it cannot be detected (self-hosting behind a proxy). |
| `ADMIN_EMAILS` | empty | Comma-separated emails made admins when they sign in. Use it once to bootstrap the first admin. |
| `APP_URL` | Vercel URL or `http://localhost:3000` | Absolute links in share cards and Open Graph tags. |

### Results

| Variable | Default | Purpose |
| --- | --- | --- |
| `RESULT_WORKER_URL` | `http://localhost:8000` | Where the result worker runs. |
| `WORKER_API_KEY` | empty | Shared secret sent as `X-Worker-Key`. Must match the worker’s `WORKER_API_KEY`. |
| `LOOKUP_LIMIT_PER_HOUR` | `30` | Uncached lookups per connection (or per signed-in student) per hour. Cached results never count. |

### After-launch sections

| Variable | Default | Purpose |
| --- | --- | --- |
| `ENABLED_FEATURES` | empty | `network` opens the feed, directory and groups; `campus` opens jobs and the market. Comma-separated. Admins always see both. |

### Notifications on phones (Web Push)

| Variable | Default | Purpose |
| --- | --- | --- |
| `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY` | empty | Generate once with `npx web-push generate-vapid-keys`. Without them, notifications still appear in the app; the “Turn on for this device” button explains why it is off. |
| `VAPID_SUBJECT` | `mailto:hello@rgpvconnect.in` | Contact the push services can reach. |

### File storage for notes and papers

| Variable | Default | Purpose |
| --- | --- | --- |
| `STORAGE_DRIVER` | `local` | `local` writes to disk and serves through `/api/files` (development, or a single self-hosted server). `s3` uses any S3-compatible bucket, such as Cloudflare R2. **Vercel needs `s3`**: its disk is read-only. |
| `LOCAL_UPLOAD_DIR` | `.uploads` | Folder for `local`, relative to `apps/web`. Git-ignored. |
| `S3_ENDPOINT` | empty | R2: `https://<account-id>.r2.cloudflarestorage.com`. Leave empty for AWS S3. |
| `S3_REGION` | `auto` | `auto` for R2. |
| `S3_BUCKET`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY` | empty | Bucket and an API token with read and write on it. |
| `S3_PUBLIC_URL` | empty | Public base URL of the bucket (R2 custom domain or `r2.dev` URL). |

Uploads go straight from the browser to storage with a signed URL that lasts
ten minutes, so large PDFs never pass through a serverless function. For R2,
allow `PUT` from your site’s origin in the bucket’s CORS rules.

### Scheduled jobs

| Variable | Default | Purpose |
| --- | --- | --- |
| `CRON_SECRET` | empty | Protects `/api/cron/results-day`, which carries on a results-day run when nobody has the admin page open. Call it every minute with `Authorization: Bearer <CRON_SECRET>`. Vercel’s Hobby plan only allows daily crons, so use a GitHub Actions schedule or any uptime pinger instead; or keep the admin page open during a run. |

`GET /api/health` answers `{"status":"ok"}` after a database ping. Point an
uptime monitor at it every few minutes to keep a free-tier database awake.

## Result worker (`services/result-worker/.env`, or Fly secrets)

| Variable | Default | Purpose |
| --- | --- | --- |
| `WORKER_API_KEY` | empty | Shared secret. When set, every endpoint except `/health` needs `X-Worker-Key`. **Set it in production**: an open worker lets anyone spend the captcha balance. |
| `CHECK_ENROLLMENT`, `CHECK_SEMESTER` | `0198CS231019`, `4` | Known-good result for the admin “live parser check”. |
| `ALLOWED_ORIGINS`, `RGPV_BASE_URL`, `REDIS_URL`, `LOG_LEVEL`, `BULK_RATE_LIMIT`, `CAPTCHA_PROVIDER`, `AZCAPTCHA_API_KEY`, `AZCAPTCHA_BASE_URL` | see `.env.example` | Unchanged; documented in [`knowledge.md`](knowledge.md). |

## Database

The October 2026 migration (`20261011000000_replan_v2`) only adds tables and
columns, and makes `Notification.actorId` optional. Apply it with:

```bash
pnpm db:migrate:deploy
```

Then load the demo world locally (never against production; it recreates only
`@rgpvconnect.dev` accounts but there is no reason to run it there):

```bash
pnpm db:seed
```

Sign in as `priyanshi@rgpvconnect.dev` (a verified CS 2028 student),
`admin@rgpvconnect.dev` (admin) or `new.student@rgpvconnect.dev`
(signed in, not verified yet). The sign-in link appears in the dev server’s
terminal.
