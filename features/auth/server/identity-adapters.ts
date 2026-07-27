import "server-only";

import { cookies } from "next/headers";

import { env } from "@/config/env";
import type { DemoUser } from "@/features/auth/server/demo-users";
import {
  type IdentitySessionStore,
  type IdentityUserLookup,
} from "@/features/auth/server/identity-provider";
import { prisma } from "@/infra/db/prisma";

export const nextCookieSessionStore: IdentitySessionStore = {
  async getSelectedUserId() {
    const cookieStore = await cookies();
    return cookieStore.get(env.DEMO_SESSION_COOKIE_NAME)?.value ?? null;
  },
};

export const prismaIdentityUserLookup: IdentityUserLookup = {
  async findById(id) {
    const user = await prisma.user.findUnique({
      where: { id },
      select: { id: true, name: true, email: true },
    });

    return user satisfies DemoUser | null;
  },
};
