import "server-only";

import { DEMO_USERS, type DemoUser } from "@/features/auth/server/demo-users";
import { identityService } from "@/features/auth/server/identity-service.server";
import { ValidationError } from "@/lib/application-errors";

export async function resolveDemoUser(): Promise<DemoUser> {
  return identityService.resolveViewerIdentity();
}

export async function getOptionalDemoUser(): Promise<DemoUser | null> {
  return identityService.resolveOptionalViewerIdentity();
}

export function validateDemoUserId(userId: string) {
  const user = DEMO_USERS.find((candidate) => candidate.id === userId);

  if (!user) {
    throw new ValidationError("Unknown demo user selection.");
  }

  return user;
}
