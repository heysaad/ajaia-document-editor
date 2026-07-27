import "server-only";

import { cookies } from "next/headers";

import type { IIdentitySessionStore } from "@/features/auth/server/IIdentitySessionStore";

export class NextCookieIdentitySessionStore
  implements IIdentitySessionStore
{
  constructor(private readonly cookieName: string) {}

  async getSelectedUserId(): Promise<string | null> {
    const cookieStore = await cookies();
    return cookieStore.get(this.cookieName)?.value ?? null;
  }
}
