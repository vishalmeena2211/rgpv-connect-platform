import { z } from 'zod';

/**
 * Server-side environment validation.
 *
 * Validation is **lazy**: the schema is parsed on first property access at
 * runtime, not at import time. This keeps `next build` from requiring runtime
 * secrets (Vercel evaluates page modules during "collect page data", which would
 * otherwise throw before env vars are available). Import `env` (not
 * `process.env`) in server code.
 */
const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  AUTH_SECRET: z.string().min(1),
  AUTH_GOOGLE_ID: z.string().optional(),
  AUTH_GOOGLE_SECRET: z.string().optional(),
  RESULT_WORKER_URL: z.string().url().default('http://localhost:8000'),
});

type Env = z.infer<typeof envSchema>;

let cached: Env | undefined;

/** Parse and cache the environment on first use. Throws if a required var is missing. */
function loadEnv(): Env {
  cached ??= envSchema.parse({
    DATABASE_URL: process.env.DATABASE_URL,
    AUTH_SECRET: process.env.AUTH_SECRET,
    AUTH_GOOGLE_ID: process.env.AUTH_GOOGLE_ID,
    AUTH_GOOGLE_SECRET: process.env.AUTH_GOOGLE_SECRET,
    RESULT_WORKER_URL: process.env.RESULT_WORKER_URL,
  });
  return cached;
}

/**
 * Validated environment. Accessing any property triggers validation once, at
 * runtime — so a missing secret fails the request, never the build.
 */
export const env = new Proxy({} as Env, {
  get: (_target, prop: string) => loadEnv()[prop as keyof Env],
});
