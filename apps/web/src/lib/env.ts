import { z } from 'zod';

/**
 * Server-side environment validation.
 *
 * Fails fast at startup if a required variable is missing, rather than throwing
 * deep inside a request handler. Import `env` (not `process.env`) in server code.
 */
const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  AUTH_SECRET: z.string().min(1),
  AUTH_GOOGLE_ID: z.string().optional(),
  AUTH_GOOGLE_SECRET: z.string().optional(),
  RESULT_WORKER_URL: z.string().url().default('http://localhost:8000'),
});

export const env = envSchema.parse({
  DATABASE_URL: process.env.DATABASE_URL,
  AUTH_SECRET: process.env.AUTH_SECRET,
  AUTH_GOOGLE_ID: process.env.AUTH_GOOGLE_ID,
  AUTH_GOOGLE_SECRET: process.env.AUTH_GOOGLE_SECRET,
  RESULT_WORKER_URL: process.env.RESULT_WORKER_URL,
});
