import "server-only";

import type { PrismaClient } from "@prisma/client";

import type { SessionUser } from "@/features/auth/models";
import type { IIdentityUserLookup } from "@/features/auth/server/IIdentityUserLookup";

export class PrismaIdentityUserLookup implements IIdentityUserLookup {
  constructor(private readonly db: PrismaClient) {}

  async findById(id: string): Promise<SessionUser | null> {
    return this.db.user.findUnique({
      where: { id },
      select: { id: true, name: true, email: true },
    });
  }
}
