import type { DemoUser } from "@/features/auth/server/demo-users";
import { UnauthorizedError } from "@/lib/application-errors";

export type IdentitySessionStore = {
  getSelectedUserId(): Promise<string | null>;
};

export type IdentityUserLookup = {
  findById(id: string): Promise<DemoUser | null>;
};

export async function resolveViewerIdentity(
  sessionStore: IdentitySessionStore,
  userLookup: IdentityUserLookup,
) {
  const selectedUserId = await sessionStore.getSelectedUserId();

  if (!selectedUserId) {
    throw new UnauthorizedError();
  }

  const user = await userLookup.findById(selectedUserId);

  if (!user) {
    throw new UnauthorizedError("The selected demo user is invalid.");
  }

  return user;
}

export async function resolveOptionalViewerIdentity(
  sessionStore: IdentitySessionStore,
  userLookup: IdentityUserLookup,
) {
  const selectedUserId = await sessionStore.getSelectedUserId();

  if (!selectedUserId) {
    return null;
  }

  return userLookup.findById(selectedUserId);
}
