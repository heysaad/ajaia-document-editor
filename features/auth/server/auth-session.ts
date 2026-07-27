import "server-only";

import { DEMO_USERS, type DemoUser } from "@/features/auth/server/demo-users";
import {
  nextCookieSessionStore,
  prismaIdentityUserLookup,
} from "@/features/auth/server/identity-adapters";
import {
  resolveOptionalViewerIdentity,
  resolveViewerIdentity,
} from "@/features/auth/server/identity-provider";
import { ValidationError } from "@/lib/application-errors";

export async function resolveDemoUser(
  lookup = prismaIdentityUserLookup,
): Promise<DemoUser> {
  return resolveViewerIdentity(nextCookieSessionStore, lookup);
}

export async function getOptionalDemoUser(
  lookup = prismaIdentityUserLookup,
): Promise<DemoUser | null> {
  return resolveOptionalViewerIdentity(nextCookieSessionStore, lookup);
}

export function validateDemoUserId(userId: string) {
  const user = DEMO_USERS.find((candidate) => candidate.id === userId);

  if (!user) {
    throw new ValidationError("Unknown demo user selection.");
  }

  return user;
}
