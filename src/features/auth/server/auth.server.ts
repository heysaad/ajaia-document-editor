import "server-only";

import { env } from "@/config/env";
import { createAuth } from "@/features/auth/server/auth-factory";
import { prisma } from "@/infra/db/prisma";

export const auth = createAuth({
  prisma,
  secret: env.BETTER_AUTH_SECRET,
  baseURL: env.BETTER_AUTH_URL,
});
