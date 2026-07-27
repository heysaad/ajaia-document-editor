import "server-only";

import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  SESSION_COOKIE_NAME: z.string().min(1).default("ajai_session"),
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
});

const parsedEnv = envSchema.safeParse({
  DATABASE_URL: process.env.DATABASE_URL,
  SESSION_COOKIE_NAME: process.env.SESSION_COOKIE_NAME,
  NODE_ENV: process.env.NODE_ENV,
});

if (!parsedEnv.success) {
  throw new Error(
    `Invalid server environment:\n${z.prettifyError(parsedEnv.error)}`,
  );
}

export const env = parsedEnv.data;
