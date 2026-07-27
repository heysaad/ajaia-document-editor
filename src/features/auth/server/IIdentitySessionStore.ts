export interface IIdentitySessionStore {
  getSelectedUserId(): Promise<string | null>;
}
