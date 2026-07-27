import "server-only";

import { headers } from "next/headers";

import type { SessionUser } from "@/features/auth/models";
import { auth } from "@/features/auth/server/auth.server";
import { UnauthorizedError } from "@/lib/application-errors";

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
