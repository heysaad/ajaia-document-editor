import type { SessionUser } from "@/features/auth/models";

export interface IIdentityUserLookup {
  findById(id: string): Promise<SessionUser | null>;
}
