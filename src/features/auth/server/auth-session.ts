import "server-only";

import { headers } from "next/headers";

import type { SessionUser } from "@/features/auth/models";
import { appContainer } from "@/infra/di/container";
import { DI_TOKENS } from "@/infra/di/tokens";
import { UnauthorizedError } from "@/lib/application-errors";

const auth = appContainer.resolve(DI_TOKENS.Auth);

export async function resolveSessionUser(): Promise<SessionUser> {
  const user = await getOptionalSessionUser();
  if (!user) {
    throw new UnauthorizedError();
  }

  return user;
}

export async function getOptionalSessionUser(): Promise<SessionUser | null> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return null;
  }

  return {
    id: session.user.id,
    name: session.user.name,
    email: session.user.email,
  };
}
