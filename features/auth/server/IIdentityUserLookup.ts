import type { DemoUser } from "@/features/auth/models";

export interface IIdentityUserLookup {
  findById(id: string): Promise<DemoUser | null>;
}
