import "server-only";

import type { PrismaClient } from "@prisma/client";
import { cookies } from "next/headers";

import type { DemoUser } from "@/features/auth/server/demo-users";
import {
  type IdentitySessionStorePort,
  type IdentityUserLookupPort,
} from "@/features/auth/server/identity-provider";

export class NextCookieIdentitySessionStore
  implements IdentitySessionStorePort
{
  constructor(private readonly cookieName: string) {}

  async getSelectedUserId(): Promise<string | null> {
    const cookieStore = await cookies();
    return cookieStore.get(this.cookieName)?.value ?? null;
  }
}

export class PrismaIdentityUserLookup implements IdentityUserLookupPort {
  constructor(private readonly db: PrismaClient) {}

  async findById(id: string): Promise<DemoUser | null> {
    const user = await this.db.user.findUnique({
      where: { id },
      select: { id: true, name: true, email: true },
    });

    return user;
  }
}
