import { describe, expect, it } from "vitest";

import {
  IdentityService,
  type IdentitySessionStorePort,
  type IdentityUserLookupPort,
} from "@/features/auth/server/identity-provider";
import { UnauthorizedError } from "@/lib/application-errors";

const user = {
  id: "771f2b30-3b0c-40d8-a96f-6c2ded9e70a1",
  name: "Maya Patel",
  email: "maya@example.com",
};

class StubIdentitySessionStore implements IdentitySessionStorePort {
  constructor(private readonly userId: string | null) {}

  async getSelectedUserId() {
    return this.userId;
  }
}

class StubIdentityUserLookup implements IdentityUserLookupPort {
  constructor(private readonly found = true) {}

  async findById() {
    return this.found ? user : null;
  }
}

describe("viewer identity", () => {
  it("resolves a selected known user", async () => {
    const service = new IdentityService(
      new StubIdentitySessionStore(user.id),
      new StubIdentityUserLookup(),
    );

    await expect(service.resolveViewerIdentity()).resolves.toEqual(user);
  });

  it("rejects a missing or unknown selection", async () => {
    const missingSessionService = new IdentityService(
      new StubIdentitySessionStore(null),
      new StubIdentityUserLookup(),
    );
    const unknownUserService = new IdentityService(
      new StubIdentitySessionStore(user.id),
      new StubIdentityUserLookup(false),
    );

    await expect(
      missingSessionService.resolveViewerIdentity(),
    ).rejects.toBeInstanceOf(UnauthorizedError);
    await expect(
      unknownUserService.resolveViewerIdentity(),
    ).rejects.toBeInstanceOf(UnauthorizedError);
  });

  it("allows an absent optional identity", async () => {
    const service = new IdentityService(
      new StubIdentitySessionStore(null),
      new StubIdentityUserLookup(),
    );

    await expect(
      service.resolveOptionalViewerIdentity(),
    ).resolves.toBeNull();
  });
});
