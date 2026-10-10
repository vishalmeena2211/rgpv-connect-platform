import { z } from 'zod';

/**
 * Server-side environment validation.
 *
 * Validation is **lazy**: the schema is parsed on first property access at
 * runtime, not at import time. This keeps `next build` from requiring runtime
 * secrets (Vercel evaluates page modules during "collect page data", which would
 * otherwise throw before env vars are available). Import `env` (not
 * `process.env`) in server code.
 *
 * Every variable is documented in docs/configuration.md.
 */
const optional = z
  .string()
  .optional()
  .transform((value) => (value && value.trim() !== '' ? value.trim() : undefined));

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  AUTH_SECRET: z.string().min(1),
  AUTH_GOOGLE_ID: optional,
  AUTH_GOOGLE_SECRET: optional,

  /** Resend API key for sign-in emails. Without it, links are printed to the server log (dev only). */
  RESEND_API_KEY: optional,
  EMAIL_FROM: z.string().default('RGPV Connect <login@rgpvconnect.in>'),
  /** Comma-separated emails that become admins when they sign in. */
  ADMIN_EMAILS: optional,

  RESULT_WORKER_URL: z.string().url().default('http://localhost:8000'),
  WORKER_API_KEY: optional,
  /** Uncached public lookups allowed per IP per hour. */
  LOOKUP_LIMIT_PER_HOUR: z.coerce.number().int().positive().default(30),

  /** Comma-separated after-launch sections to open: network, campus. */
  ENABLED_FEATURES: optional,

  VAPID_PUBLIC_KEY: optional,
  VAPID_PRIVATE_KEY: optional,
  VAPID_SUBJECT: z.string().default('mailto:hello@rgpvconnect.in'),

  STORAGE_DRIVER: z.enum(['local', 's3']).default('local'),
  LOCAL_UPLOAD_DIR: z.string().default('.uploads'),
  S3_ENDPOINT: optional,
  S3_REGION: z.string().default('auto'),
  S3_BUCKET: optional,
  S3_ACCESS_KEY_ID: optional,
  S3_SECRET_ACCESS_KEY: optional,
  /** Public base URL of the bucket, e.g. https://files.rgpvconnect.in */
  S3_PUBLIC_URL: optional,

  /** Shared secret for /api/cron/* (Vercel Cron sends it as a bearer token). */
  CRON_SECRET: optional,
});

type Env = z.infer<typeof envSchema>;

let cached: Env | undefined;

/** Parse and cache the environment on first use. Throws if a required var is missing. */
function loadEnv(): Env {
  cached ??= envSchema.parse(process.env);
  return cached;
}

/**
 * Validated environment. Accessing any property triggers validation once, at
 * runtime — so a missing secret fails the request, never the build.
 */
export const env = new Proxy({} as Env, {
  get: (_target, prop: string) => loadEnv()[prop as keyof Env],
});
