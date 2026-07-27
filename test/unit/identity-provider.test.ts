import { describe, expect, it } from "vitest";

import {
  resolveOptionalViewerIdentity,
  resolveViewerIdentity,
  type IdentitySessionStore,
  type IdentityUserLookup,
} from "@/features/auth/server/identity-provider";
import { UnauthorizedError } from "@/lib/application-errors";

const user = {
  id: "771f2b30-3b0c-40d8-a96f-6c2ded9e70a1",
  name: "Maya Patel",
  email: "maya@example.com",
};

function session(userId: string | null): IdentitySessionStore {
  return { getSelectedUserId: async () => userId };
}

function lookup(found = true): IdentityUserLookup {
  return { findById: async () => (found ? user : null) };
}

describe("viewer identity", () => {
  it("resolves a selected known user", async () => {
    await expect(resolveViewerIdentity(session(user.id), lookup())).resolves.toEqual(
      user,
    );
  });

  it("rejects a missing or unknown selection", async () => {
    await expect(resolveViewerIdentity(session(null), lookup())).rejects.toBeInstanceOf(
      UnauthorizedError,
    );
    await expect(
      resolveViewerIdentity(session(user.id), lookup(false)),
    ).rejects.toBeInstanceOf(UnauthorizedError);
  });

  it("allows an absent optional identity", async () => {
    await expect(
      resolveOptionalViewerIdentity(session(null), lookup()),
    ).resolves.toBeNull();
  });
});
