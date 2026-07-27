import type { SessionUser } from "@/features/auth/models";

export interface IIdentityService {
  resolveViewerIdentity(): Promise<SessionUser>;
  resolveOptionalViewerIdentity(): Promise<SessionUser | null>;
}
