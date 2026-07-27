import type { DemoUser } from "@/features/auth/server/demo-users";
import { UnauthorizedError } from "@/lib/application-errors";

export interface IdentitySessionStorePort {
  getSelectedUserId(): Promise<string | null>;
}

export interface IdentityUserLookupPort {
  findById(id: string): Promise<DemoUser | null>;
}

export interface IdentityServicePort {
  resolveViewerIdentity(): Promise<DemoUser>;
  resolveOptionalViewerIdentity(): Promise<DemoUser | null>;
}

export class IdentityService implements IdentityServicePort {
  constructor(
    private readonly sessionStore: IdentitySessionStorePort,
    private readonly userLookup: IdentityUserLookupPort,
  ) {}

  async resolveViewerIdentity(): Promise<DemoUser> {
    const selectedUserId = await this.sessionStore.getSelectedUserId();

    if (!selectedUserId) {
      throw new UnauthorizedError();
    }

    const user = await this.userLookup.findById(selectedUserId);

    if (!user) {
      throw new UnauthorizedError("The selected demo user is invalid.");
    }

    return user;
  }

  async resolveOptionalViewerIdentity(): Promise<DemoUser | null> {
    const selectedUserId = await this.sessionStore.getSelectedUserId();

    if (!selectedUserId) {
      return null;
    }

    return this.userLookup.findById(selectedUserId);
  }
}
