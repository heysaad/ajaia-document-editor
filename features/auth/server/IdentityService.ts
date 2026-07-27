import type { DemoUser } from "@/features/auth/models";
import type { IIdentityService } from "@/features/auth/server/IIdentityService";
import type { IIdentitySessionStore } from "@/features/auth/server/IIdentitySessionStore";
import type { IIdentityUserLookup } from "@/features/auth/server/IIdentityUserLookup";
import { UnauthorizedError } from "@/lib/application-errors";

export class IdentityService implements IIdentityService {
  constructor(
    private readonly sessionStore: IIdentitySessionStore,
    private readonly userLookup: IIdentityUserLookup,
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
