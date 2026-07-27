import "server-only";

import { env } from "@/config/env";
import { IdentityService } from "@/features/auth/server/IdentityService";
import type { IIdentityService } from "@/features/auth/server/IIdentityService";
import { NextCookieIdentitySessionStore } from "@/features/auth/server/NextCookieIdentitySessionStore";
import { PrismaIdentityUserLookup } from "@/features/auth/server/PrismaIdentityUserLookup";
import { prisma } from "@/infra/db/prisma";

const sessionStore = new NextCookieIdentitySessionStore(
  env.SESSION_COOKIE_NAME,
);
const userLookup = new PrismaIdentityUserLookup(prisma);

export const identityService: IIdentityService = new IdentityService(
  sessionStore,
  userLookup,
);
