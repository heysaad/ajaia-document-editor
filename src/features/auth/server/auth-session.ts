import "server-only";

import type { SessionUser } from "@/features/auth/models";
import { identityService } from "@/features/auth/server/identity-service.server";
import { SEEDED_USERS } from "@/features/auth/server/seeded-users";
import { ValidationError } from "@/lib/application-errors";

export async function resolveSessionUser(): Promise<SessionUser> {
  return identityService.resolveViewerIdentity();
}

export async function getOptionalSessionUser(): Promise<SessionUser | null> {
  return identityService.resolveOptionalViewerIdentity();
}

export function validateSessionUserId(userId: string) {
  const user = SEEDED_USERS.find((candidate) => candidate.id === userId);

  if (!user) {
    throw new ValidationError("Unknown user selection.");
  }

  return user;
}
