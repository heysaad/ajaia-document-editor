import type { DemoUser } from "@/features/auth/models";

export interface IIdentityService {
  resolveViewerIdentity(): Promise<DemoUser>;
  resolveOptionalViewerIdentity(): Promise<DemoUser | null>;
}
