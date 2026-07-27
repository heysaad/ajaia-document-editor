import "server-only";

import { env } from "@/config/env";
import {
  NextCookieIdentitySessionStore,
  PrismaIdentityUserLookup,
} from "@/features/auth/server/identity-adapters";
import {
  IdentityService,
  type IdentityServicePort,
} from "@/features/auth/server/identity-provider";
import { prisma } from "@/infra/db/prisma";

const sessionStore = new NextCookieIdentitySessionStore(
  env.DEMO_SESSION_COOKIE_NAME,
);
const userLookup = new PrismaIdentityUserLookup(prisma);

export const identityService: IdentityServicePort = new IdentityService(
  sessionStore,
  userLookup,
);
